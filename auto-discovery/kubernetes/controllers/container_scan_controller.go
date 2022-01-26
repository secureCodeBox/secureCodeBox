// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"bytes"
	"context"
	"regexp"
	"strings"
	"text/template"

	"github.com/go-logr/logr"
	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"

	"github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/pkg/util"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	corev1 "k8s.io/api/core/v1"
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

// +kubebuilder:rbac:groups=core,resources=pods,verbs=get;list;watch;

// Reconcile compares the Pod object against the state of the cluster and updates both if needed
func (r *ContainerScanReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := r.Log

	log.V(1).Info("Something happened to a pod", "pod", req.Name, "namespace", req.Namespace)

	var pod corev1.Pod
	err := r.Get(ctx, req.NamespacedName, &pod)
	if err != nil {
		log.V(1).Info("Unable to fetch Pod", "pod", req.Name, "namespace", req.Namespace)
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	if podManagedBySecureCodeBox(pod) {
		log.V(1).Info("Pod will be ignored, as it is managed by securecodebox", "pod", pod)
		return ctrl.Result{}, nil
	}

	if podNotReady(pod) {
		log.V(1).Info("Pod not ready", "pod", pod.Name)
		return ctrl.Result{}, nil
	}

	if pod.DeletionTimestamp == nil {
		podIsRunning(r.Config, r.Client, log, ctx, pod)
	} else {
		podWillBeDeleted(r.Client, log, ctx, pod)
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

func podIsRunning(config configv1.AutoDiscoveryConfig, k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod) {
	log.V(1).Info("Pod is running", "pod", pod.Name, "namespace", pod.Namespace)
	nonScannedImageIDs := getNonScannedImageIDs(k8sclient, log, ctx, pod)
	createScheduledScans(config, k8sclient, log, ctx, pod, nonScannedImageIDs)
}

func getNonScannedImageIDs(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod) []string {
	var result []string
	allImageIDs := getImageIDsForPod(pod)

	for _, imageID := range allImageIDs {
		scanName := getScanName(imageID)
		var scan executionv1.ScheduledScan
		err := k8sclient.Get(ctx, types.NamespacedName{Name: scanName, Namespace: pod.Namespace}, &scan)

		if apierrors.IsNotFound(err) {
			result = append(result, imageID)
		} else if err != nil {
			log.V(1).Info("Unable to fetch scan", "name", scanName, "namespace", pod.Namespace)
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

func getScanName(imageID string) string {
	baseScanName := "scan-"
	maxAppLength := 20 + len(baseScanName)

	hashRegex := regexp.MustCompile(".*/(?P<url>.*)@sha256:(?P<hash>.*)")
	appName := hashRegex.FindStringSubmatch(imageID)[1]
	hash := hashRegex.FindStringSubmatch(imageID)[2]

	result := baseScanName + appName
	if len(result) > maxAppLength {
		result = result[:maxAppLength]
	}

	result += "-at-" + hash

	result = strings.ReplaceAll(result, ".", "-")
	result = strings.ReplaceAll(result, "/", "-")
	return result[:62]
}

func createScheduledScans(config configv1.AutoDiscoveryConfig, k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod, imageIDs []string) {
	for _, imageID := range imageIDs {
		createScheduledScan(config, k8sclient, log, ctx, pod, imageID)
	}
}

func createScheduledScan(config configv1.AutoDiscoveryConfig, k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod, imageID string) {
	newScheduledScan := getScanSpec(config, pod, imageID)
	err := k8sclient.Create(ctx, &newScheduledScan)

	if err != nil {
		log.V(1).Info("Failed to create scheduled scan", "err", err)
	} else {
		log.V(1).Info("Created scheduled scan", "pod", pod.Name, "namespace", pod.Namespace)
	}
}

func getScanSpec(config configv1.AutoDiscoveryConfig, pod corev1.Pod, imageID string) executionv1.ScheduledScan {
	containerScanConfig := config.ContainerAutoDiscoveryConfig.ScanConfig

	newScheduledScan := executionv1.ScheduledScan{
		ObjectMeta: metav1.ObjectMeta{
			Name:        getScanName(imageID),
			Namespace:   pod.Namespace,
			Annotations: getScanAnnotations(config, pod, imageID),
			Labels:      getScanLabels(config, pod, imageID),
		},
		Spec: executionv1.ScheduledScanSpec{
			Interval: containerScanConfig.RepeatInterval,
			ScanSpec: &executionv1.ScanSpec{
				ScanType:   containerScanConfig.ScanType,
				Parameters: getScanParameters(config, pod, imageID),
			},
		},
	}
	return newScheduledScan
}

func podWillBeDeleted(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod) {
	log.V(1).Info("Pod will be deleted", "pod", pod.Name, "namespace", pod.Namespace, "timestamp", pod.DeletionTimestamp)
	allImageIDs := getImageIDsForPod(pod)
	imageIDsToBeDeleted := getOrphanedScanImageIDs(k8sclient, log, ctx, pod, allImageIDs)
	deleteScans(k8sclient, log, ctx, pod, imageIDsToBeDeleted)
}

func getOrphanedScanImageIDs(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod, imageIDs []string) []string {
	var result []string

	for _, imageID := range imageIDs {
		scanName := getScanName(imageID)
		var scan executionv1.ScheduledScan
		err := k8sclient.Get(ctx, types.NamespacedName{Name: scanName, Namespace: pod.Namespace}, &scan)
		if err != nil {
			log.V(1).Info("Unable to fetch scan", "name", scanName)
			continue
		}

		if !containerIDInUse(k8sclient, log, ctx, pod, imageID) {
			result = append(result, imageID)
		}
	}
	return result
}

func containerIDInUse(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod, imageID string) bool {
	var pods corev1.PodList
	err := k8sclient.List(ctx, &pods, client.InNamespace(pod.Namespace))

	if err != nil {
		log.V(1).Info("Unable to fetch pods", "namespace", pod.Namespace)
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

func deleteScans(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod, imageIDs []string) {
	for _, imageID := range imageIDs {
		scan, err := getScan(k8sclient, log, ctx, pod, imageID)

		if err != nil {
			log.V(1).Info("Unable to fetch scan", "err", err)
			continue
		}

		err = k8sclient.Delete(ctx, &scan)
		if err != nil {
			log.V(1).Info("Unable to delete scheduled scan", "scan", scan.Name)
		} else {
			log.V(1).Info("Deleting scheduled scan", "scan", scan.Name)
		}
	}
}

func getScan(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod, imageID string) (executionv1.ScheduledScan, error) {
	var scan executionv1.ScheduledScan
	scanName := getScanName(imageID)
	err := k8sclient.Get(ctx, types.NamespacedName{Name: scanName, Namespace: pod.Namespace}, &scan)
	return scan, err
}

func getScanAnnotations(config configv1.AutoDiscoveryConfig, pod corev1.Pod, imageID string) map[string]string {
	type annotations struct {
		Config  configv1.AutoDiscoveryConfig
		Pod     corev1.Pod
		ImageID string
	}

	data := annotations{config, pod, imageID}
	templates := config.ContainerAutoDiscoveryConfig.ScanConfig.Annotations
	return parseMapTemplate(data, templates)
}

func getScanParameters(config configv1.AutoDiscoveryConfig, pod corev1.Pod, imageID string) []string {
	type parameters struct {
		Config  configv1.AutoDiscoveryConfig
		Pod     corev1.Pod
		ImageID string
	}

	data := parameters{config, pod, imageID}
	templates := config.ContainerAutoDiscoveryConfig.ScanConfig.Parameters
	return parseListTemplate(data, templates)
}

func getScanLabels(config configv1.AutoDiscoveryConfig, pod corev1.Pod, imageID string) map[string]string {
	type labels struct {
		Config  configv1.AutoDiscoveryConfig
		Pod     corev1.Pod
		ImageID string
	}

	data := labels{config, pod, imageID}
	templates := config.ContainerAutoDiscoveryConfig.ScanConfig.Labels

	generatedLabels := parseMapTemplate(data, templates)
	generatedLabels["app.kubernetes.io/managed-by"] = "securecodebox-autodiscovery"

	return generatedLabels
}

func parseMapTemplate(dataStruct interface{}, templates map[string]string) map[string]string {
	result := map[string]string{}

	for key, value := range templates {
		tmpl, err := template.New(key).Parse(value)

		if err != nil {
			panic(err)
		}

		var tmp bytes.Buffer
		tmpl.Execute(&tmp, dataStruct)
		result[key] = tmp.String()
	}
	return result
}
func parseListTemplate(dataStruct interface{}, templates []string) []string {
	var result []string

	for _, value := range templates {
		tmpl, err := template.New(value).Parse(value)

		if err != nil {
			panic(err)
		}

		var tmp bytes.Buffer
		tmpl.Execute(&tmp, dataStruct)
		result = append(result, tmp.String())
	}
	return result
}

// SetupWithManager sets up the controller and initializes every thing it needs
func (r *ContainerScanReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1.Pod{}).
		WithEventFilter(util.GetPredicates(mgr.GetClient(), r.Log, r.Config.ResourceInclusion.Mode)).
		Complete(r)
}
