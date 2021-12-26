// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"context"
	"regexp"

	"github.com/go-logr/logr"
	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/tools/record"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type PodScanReconciler struct {
	client.Client
	Log      logr.Logger
	Scheme   *runtime.Scheme
	Recorder record.EventRecorder
	Config   configv1.AutoDiscoveryConfig
}

// +kubebuilder:rbac:groups=core,resources=pods,verbs=get;list;watch;update;patch

// Reconcile compares the Pod object against the state of the cluster and updates both if needed
func (r *PodScanReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
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

	if len(getLabelsForPod(pod)) == 0 {
		log.V(1).Info("Pod not ready", "pod", pod.Name)
		return ctrl.Result{}, nil
	}

	if pod.DeletionTimestamp == nil {
		podIsRunning(r.Client, log, ctx, pod)
	} else {
		log.V(1).Info("Pod will be deleted", "pod", pod.Name, "namespace", pod.Namespace, "timestamp", pod.DeletionTimestamp)
	}

	return ctrl.Result{}, nil
}

func podIsRunning(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod) {
	log.V(1).Info("Pod is running", "pod", pod.Name, "namespace", pod.Namespace)
	podHasScans := podVersionHasScan(k8sclient, log, ctx, pod)
	if podHasScans {
		//pod has scans, no further actions required
		log.V(1).Info("Pod or similiar pods have scheduled scans", "pod", pod.Name, "namespace", pod.Namespace)
	} else {
		log.V(1).Info("Pod and similiar pods have no scheduled scans", "pod", pod.Name, "namespace", pod.Namespace)
		createScheduledScan(k8sclient, log, ctx, pod)
	}
}

func podVersionHasScan(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod) bool {
	labels := getLabelsForPod(pod)

	log.V(1).Info("Checking for labels", "labels", labels)
	var scans executionv1.ScheduledScanList
	if err := k8sclient.List(ctx, &scans, client.MatchingLabels(labels), client.InNamespace(pod.Namespace)); err != nil {
		log.V(1).Info("Unable to fetch scheduledscans by labels", "labels", labels, "pod", pod.Name)
	}

	return len(scans.Items) > 0
}

func createScheduledScan(k8sclient client.Client, log logr.Logger, ctx context.Context, pod corev1.Pod) {
	newScheduledScan := executionv1.ScheduledScan{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "scheduledtestscan",
			Namespace: pod.Namespace,
			Labels:    getLabelsForPod(pod),
		},
		Spec: executionv1.ScheduledScanSpec{
			ScanSpec: &executionv1.ScanSpec{
				ScanType: "nmap",
			},
		},
	}
	err := k8sclient.Create(ctx, &newScheduledScan)
	if err != nil {
		//log.V(1).Info("Failed to create scheduled scan", "scan", newScheduledScan, "pod", pod)
		log.V(1).Info("Failed to create scheduled scan", "err", err)
	}
	log.V(1).Info("Created scheduled scan", "pod", pod.Name, "namespace", pod.Namespace)
}

func getLabelsForPod(pod corev1.Pod) map[string]string {
	hashes := getHashesForPod(pod)
	result := make(map[string]string)
	for key, value := range hashes {
		//truncate hash to 63 chars so it can be used as a label
		result[key] = value[:len(value)-1]
	}
	return result
}

func getHashesForPod(pod corev1.Pod) map[string]string {
	result := make(map[string]string)
	for _, container := range pod.Status.ContainerStatuses {
		hashRegex := regexp.MustCompile(".*sha256:(?P<hash>.*)")

		imageID := container.ImageID
		if imageID != "" {
			hash := hashRegex.FindStringSubmatch(imageID)[1]
			result[container.Name] = hash
		}
	}
	return result
}

// SetupWithManager sets up the controller and initializes every thing it needs
func (r *PodScanReconciler) SetupWithManager(mgr ctrl.Manager) error {

	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1.Pod{}).
		Complete(r)
}
