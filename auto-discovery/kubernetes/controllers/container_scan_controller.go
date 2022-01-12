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

// +kubebuilder:rbac:groups=core,resources=pods,verbs=get;list;watch;update;patch

// Reconcile compares the Pod object against the state of the cluster and updates both if needed
func (r *ContainerScanReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := r.Log

	if req.Namespace != "default" {
		log.V(10).Info("Ignoring non default namespace", "pod", req.Name)
		return ctrl.Result{}, nil
	}

	log.V(1).Info("Something happened to a pod", "pod", req.Name, "namespace", req.Namespace)

	var pod corev1.Pod
	if err := r.Get(ctx, req.NamespacedName, &pod); err != nil {
		log.V(1).Info("Unable to fetch Pod", "pod", req.Name, "namespace", req.Namespace)
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	//check if container imageIDs are present, otherwise pod is not ready yet
	if len(getImageIDsForPod(pod)) == 0 {
		log.V(1).Info("Pod not ready", "pod", pod.Name)
		return ctrl.Result{}, nil
	}

	if pod.DeletionTimestamp == nil {
		podIsRunning(r.Client, log, ctx, pod)
	} else {
		log.V(1).Info("Pod will be deleted", "pod", pod.Name, "namespace", pod.Namespace, "timestamp", pod.DeletionTimestamp)
		podWillBeDeleted(r.Client, log, ctx, pod)
	}

	return ctrl.Result{}, nil
}

func podIsRunning(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod) {
	log.V(1).Info("Pod is running", "pod", pod.Name, "namespace", pod.Namespace)
	getNonScanedImageIDs := getNonScanedImageIDs(k8sclient, log, ctx, pod)
	createScheduledScans(k8sclient, log, ctx, pod, getNonScanedImageIDs)
}

func getNonScanedImageIDs(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod) []string {
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

func createScheduledScans(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod, imageIDs []string) {
	for _, imageID := range imageIDs {
		createScheduledScan(k8sclient, log, ctx, pod, imageID)
	}
}

func createScheduledScan(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod, imageID string) {
	newScheduledScan := executionv1.ScheduledScan{
		ObjectMeta: metav1.ObjectMeta{
			Name:        getScanName(imageID),
			Namespace:   pod.Namespace,
			Annotations: map[string]string{"target_imageID": imageID},
		},
		Spec: executionv1.ScheduledScanSpec{
			ScanSpec: &executionv1.ScanSpec{
				ScanType: "nmap",
			},
		},
	}
	err := k8sclient.Create(ctx, &newScheduledScan)
	if err != nil {
		log.V(1).Info("Failed to create scheduled scan", "err", err)
	} else {
		log.V(1).Info("Created scheduled scan", "pod", pod.Name, "namespace", pod.Namespace)
	}
}

func podWillBeDeleted(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod) {
	allImageIDs := getImageIDsForPod(pod)
	imageIDsToBeDeleted := getImageIDsToBeDeleted(k8sclient, log, ctx, pod, allImageIDs)
	deleteScans(k8sclient, log, ctx, pod, imageIDsToBeDeleted)
}

func getImageIDsToBeDeleted(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod, imageIDs []string) []string {
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

// SetupWithManager sets up the controller and initializes every thing it needs
func (r *ContainerScanReconciler) SetupWithManager(mgr ctrl.Manager) error {

	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1.Pod{}).
		Complete(r)
}
