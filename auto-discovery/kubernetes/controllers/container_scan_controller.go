// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"context"
	"regexp"
	"strings"

	"github.com/go-logr/logr"
	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"

	"github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/pkg/util"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/tools/record"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type ContainerScanReconciler struct {
	client.Client
	Log      logr.Logger
	Scheme   *runtime.Scheme
	Recorder record.EventRecorder
	Config   configv1.AutoDiscoveryConfig
}

type Cluster struct {
	Name string
}
type ContainerAutoDiscoveryTemplateArgs struct {
	Config     configv1.AutoDiscoveryConfig
	ScanConfig configv1.ScanConfig
	Cluster    configv1.ClusterConfig
	Target     metav1.ObjectMeta
	Namespace  corev1.Namespace
	ImageID    string
}

// +kubebuilder:rbac:groups=core,resources=pods,verbs=get;list;watch;

// Reconcile compares the Pod object against the state of the cluster and updates both if needed
func (r *ContainerScanReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := r.Log

	log.V(8).Info("Something happened to a pod", "pod", req.Name, "namespace", req.Namespace)

	var pod corev1.Pod
	err := r.Get(ctx, req.NamespacedName, &pod)
	if err != nil {
		//dont log an error, as a deleted pod cant be fetched and would spam the logs
		log.V(7).Info("Unable to fetch Pod", "pod", req.Name, "namespace", req.Namespace)
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	if podManagedBySecureCodeBox(pod) {
		log.V(7).Info("Pod will be ignored, as it is managed by securecodebox", "pod", pod)
		return ctrl.Result{}, nil
	}

	if podNotReady(pod) {
		log.V(6).Info("Pod not ready", "pod", pod.Name)
		return ctrl.Result{}, nil
	}

	if pod.DeletionTimestamp == nil {

		scanTypeInstalled := r.checkForScanType(ctx, pod)
		if scanTypeInstalled {
			r.checkIfNewScansNeedToBeCreated(ctx, pod)
		} else {
			requeueDuration := r.Config.ContainerAutoDiscoveryConfig.PassiveReconcileInterval.Duration
			return ctrl.Result{Requeue: true, RequeueAfter: requeueDuration}, nil
		}

	} else {
		r.checkIfScansNeedToBeDeleted(ctx, pod)
	}

	return ctrl.Result{}, nil
}

func podManagedBySecureCodeBox(pod corev1.Pod) bool {
	labels := pod.ObjectMeta.Labels
	value, exists := labels["app.kubernetes.io/managed-by"]

	if exists {
		regexPattern := regexp.MustCompile("securecodebox.*")
		return regexPattern.MatchString(value)
	}
	return false
}

func podNotReady(pod corev1.Pod) bool {
	//check if container imageIDs are present, otherwise pod is not ready yet
	return len(getImageIDsForPod(pod)) == 0
}

func (r *ContainerScanReconciler) checkIfNewScansNeedToBeCreated(ctx context.Context, pod corev1.Pod) {
	r.Log.V(8).Info("Pod is running", "pod", pod.Name, "namespace", pod.Namespace)
	nonScannedImageIDs := r.getNonScannedImageIDs(ctx, pod)
	r.createScheduledScans(ctx, pod, nonScannedImageIDs)
}

func (r *ContainerScanReconciler) getNonScannedImageIDs(ctx context.Context, pod corev1.Pod) []string {
	var result []string
	allImageIDs := getImageIDsForPod(pod)

	for _, imageID := range allImageIDs {
		cleanedImageID := cleanupImageID(imageID, r.Log)
		scanName := getScanName(cleanedImageID)

		var scan executionv1.ScheduledScan
		err := r.Client.Get(ctx, types.NamespacedName{Name: scanName, Namespace: pod.Namespace}, &scan)

		if apierrors.IsNotFound(err) {
			result = append(result, cleanedImageID)
		} else if err != nil {
			r.Log.Error(err, "Unable to fetch scan", "name", scanName, "namespace", pod.Namespace)
		}
	}
	return result
}

func getImageIDsForPod(pod corev1.Pod) []string {
	var result []string

	for _, container := range pod.Status.ContainerStatuses {
		imageID := container.ImageID
		if imageID != "" {
			result = append(result, imageID)
		}
	}
	return result
}

func cleanupImageID(imageID string, log logr.Logger) string {
	//some setups will add a protocol to the imageID like "docker-pullable://some/image:sha256@0123456789"
	//this function removes the protocol as it interferes with trivy
	//the imageid above will be transformed to "some/image:sha256@0123456789"
	imageRegex := regexp.MustCompile("(.*://)?(.*)")
	return imageRegex.FindStringSubmatch(imageID)[2]
}

func getScanName(imageID string) string {
	//function builds string like: _appName_-at-_imageID_HASH_ eg: nginx-at-0123456789

	//define appname cutoff limit to 20 chars
	maxAppLength := 20

	hashRegex := regexp.MustCompile(".*/(?P<appName>.*)@sha256:(?P<hash>.*)")
	appName := hashRegex.FindStringSubmatch(imageID)[1]
	hash := hashRegex.FindStringSubmatch(imageID)[2]

	//cutoff appname if it is longer than 20 chars
	result := appName
	if len(result) > maxAppLength {
		result = result[:maxAppLength]
	}

	result += "-at-" + hash

	result = strings.ReplaceAll(result, ".", "-")
	result = strings.ReplaceAll(result, "/", "-")

	//limit scan name length to kubernetes limits
	return result[:62]
}

func (r *ContainerScanReconciler) createScheduledScans(ctx context.Context, pod corev1.Pod, imageIDs []string) {
	for _, imageID := range imageIDs {
		r.createScheduledScan(ctx, pod, imageID)
	}
}

func (r *ContainerScanReconciler) createScheduledScan(ctx context.Context, pod corev1.Pod, imageID string) {
	namespace := r.getNamespace(ctx, pod)

	newScheduledScan := r.generateScan(pod, imageID, namespace)
	err := r.Client.Create(ctx, &newScheduledScan)

	if err != nil {
		r.Log.Error(err, "Failed to create scheduled scan", "scan", newScheduledScan, "namespace", namespace)
	} else {
		r.Log.V(6).Info("Created scheduled scan", "pod", pod.Name, "namespace", pod.Namespace)
	}
}
func (r *ContainerScanReconciler) getNamespace(ctx context.Context, pod corev1.Pod) corev1.Namespace {
	var result corev1.Namespace
	err := r.Client.Get(ctx, types.NamespacedName{Name: pod.Namespace, Namespace: ""}, &result)

	if err != nil {
		r.Log.Error(err, "Could not retrieve namespace of pod", "pod", pod)
	}
	return result
}

func (r *ContainerScanReconciler) generateScan(pod corev1.Pod, imageID string, namespace corev1.Namespace) executionv1.ScheduledScan {
	scanConfig := r.Config.ContainerAutoDiscoveryConfig.ScanConfig
	templateArgs := ContainerAutoDiscoveryTemplateArgs{
		Config:     r.Config,
		ScanConfig: scanConfig,
		Cluster:    r.Config.Cluster,
		Target:     pod.ObjectMeta,
		Namespace:  namespace,
		ImageID:    imageID,
	}
	scanSpec := util.GenerateScanSpec(scanConfig, templateArgs)

	newScheduledScan := executionv1.ScheduledScan{
		ObjectMeta: metav1.ObjectMeta{
			Name:        getScanName(imageID),
			Namespace:   pod.Namespace,
			Annotations: getScanAnnotations(scanConfig, templateArgs),
			Labels:      getScanLabels(scanConfig, templateArgs),
		},
		Spec: scanSpec,
	}
	return newScheduledScan
}

func (r *ContainerScanReconciler) checkForScanType(ctx context.Context, pod corev1.Pod) bool {
	namespace := r.getNamespace(ctx, pod)

	scanTypeName := r.Config.ContainerAutoDiscoveryConfig.ScanConfig.ScanType
	scanType := executionv1.ScanType{}
	err := r.Get(ctx, types.NamespacedName{Name: scanTypeName, Namespace: namespace.Name}, &scanType)
	if errors.IsNotFound(err) {
		r.Log.Info("Namespace requires configured ScanType to properly start automatic scans.", "namespace", namespace.Name, "service", pod.Name, "scanType", scanTypeName)
		// Add event to pod to communicate failure to user
		r.Recorder.Event(&pod, "Warning", "ScanTypeMissing", "Namespace requires ScanType '"+scanTypeName+"' to properly start automatic scans.")
		return false
	}
	return true
}

func (r *ContainerScanReconciler) checkIfScansNeedToBeDeleted(ctx context.Context, pod corev1.Pod) {
	r.Log.V(8).Info("Pod will be deleted", "pod", pod.Name, "namespace", pod.Namespace, "timestamp", pod.DeletionTimestamp)
	allImageIDs := getImageIDsForPod(pod)
	imageIDsToBeDeleted := r.getOrphanedScanImageIDs(ctx, pod, allImageIDs)
	r.deleteScans(ctx, pod, imageIDsToBeDeleted)
}

func (r *ContainerScanReconciler) getOrphanedScanImageIDs(ctx context.Context, pod corev1.Pod, imageIDs []string) []string {
	var result []string

	for _, imageID := range imageIDs {
		cleanedImageID := cleanupImageID(imageID, r.Log)
		scanName := getScanName(cleanedImageID)

		var scan executionv1.ScheduledScan
		err := r.Client.Get(ctx, types.NamespacedName{Name: scanName, Namespace: pod.Namespace}, &scan)
		if err != nil {
			r.Log.Error(err, "Unable to fetch scan", "name", scanName)
		} else if !r.containerIDInUse(ctx, pod, imageID) {
			result = append(result, cleanedImageID)
		}
	}
	return result
}

func (r *ContainerScanReconciler) containerIDInUse(ctx context.Context, pod corev1.Pod, imageID string) bool {
	var pods corev1.PodList
	err := r.Client.List(ctx, &pods, client.InNamespace(pod.Namespace))

	if err != nil {
		r.Log.Error(err, "Unable to fetch pods from namespace", "namespace", pod.Namespace)
		return false
	}
	return searchForImageIDInPods(pods.Items, imageID)
}

func searchForImageIDInPods(pods []corev1.Pod, targetImageID string) bool {
	for _, pod := range pods {
		imageIDS := getImageIDsForPod(pod)

		for _, imageID := range imageIDS {
			if pod.DeletionTimestamp == nil && imageID == targetImageID {
				return true
			}
		}
	}
	return false
}

func (r *ContainerScanReconciler) deleteScans(ctx context.Context, pod corev1.Pod, imageIDs []string) {
	for _, imageID := range imageIDs {
		scan, err := r.getScan(ctx, pod, imageID)

		if err != nil {
			r.Log.Error(err, "Unable to fetch scan", "pod", pod, "imageID", imageID)
			continue
		}

		err = r.Client.Delete(ctx, &scan)
		if err != nil {
			r.Log.Error(err, "Unable to delete scheduled scan", "scan", scan.Name)
		} else {
			r.Log.V(6).Info("Deleting scheduled scan", "scan", scan.Name)
		}
	}
}

func (r *ContainerScanReconciler) getScan(ctx context.Context, pod corev1.Pod, imageID string) (executionv1.ScheduledScan, error) {
	var scan executionv1.ScheduledScan
	scanName := getScanName(imageID)
	err := r.Client.Get(ctx, types.NamespacedName{Name: scanName, Namespace: pod.Namespace}, &scan)
	return scan, err
}

func getScanAnnotations(scanConfig configv1.ScanConfig, templateArgs ContainerAutoDiscoveryTemplateArgs) map[string]string {
	return util.ParseMapTemplate(templateArgs, scanConfig.Annotations)
}

func getScanLabels(scanConfig configv1.ScanConfig, templateArgs ContainerAutoDiscoveryTemplateArgs) map[string]string {
	generatedLabels := util.ParseMapTemplate(templateArgs, scanConfig.Labels)
	generatedLabels["app.kubernetes.io/managed-by"] = "securecodebox-autodiscovery"

	return generatedLabels
}

// SetupWithManager sets up the controller and initializes every thing it needs
func (r *ContainerScanReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1.Pod{}).
		WithEventFilter(util.GetPredicates(mgr.GetClient(), r.Log, r.Config.ResourceInclusion.Mode)).
		Complete(r)
}
