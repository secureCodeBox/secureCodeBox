// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"context"

	"github.com/go-logr/logr"
	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"

	corev1 "k8s.io/api/core/v1"
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
		log.V(10).Info("Igonring non default namespace", "pod", req.Name)
		return ctrl.Result{}, nil
	}

	log.V(1).Info("Something happened to a pod", "pod", req.Name, "namespace", req.Namespace)

	var pod corev1.Pod
	if err := r.Get(ctx, req.NamespacedName, &pod); err != nil {
		log.V(1).Info("Unable to fetch Pod", "pod", req.Name, "namespace", req.Namespace)
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	if pod.DeletionTimestamp == nil {
		log.V(1).Info("Pod is running", "pod", pod.Name, "namespace", pod.Namespace)

	} else {
		log.V(1).Info("Pod will be deleted", "pod", pod.Name, "namespace", pod.Namespace, "timestamp", pod.DeletionTimestamp)

	}

	return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller and initializes every thing it needs
func (r *PodScanReconciler) SetupWithManager(mgr ctrl.Manager) error {

	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1.Pod{}).
		Complete(r)
}
