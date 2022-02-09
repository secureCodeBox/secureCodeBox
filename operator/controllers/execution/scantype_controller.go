// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"context"
	"strconv"
	"time"

	"github.com/go-logr/logr"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	util "github.com/secureCodeBox/secureCodeBox/operator/utils"

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/tools/record"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// ServiceScanReconciler reconciles a Service object
type ScanTypeReconciler struct {
	client.Client
	Log      logr.Logger
	Scheme   *runtime.Scheme
	Recorder record.EventRecorder
}

// +kubebuilder:rbac:groups="execution.securecodebox.io",resources=scantypes,verbs=get;list;watch
// +kubebuilder:rbac:groups="execution.securecodebox.io",resources=scheduledscans,verbs=get;list;watch;create;update;patch
// +kubebuilder:rbac:groups="execution.securecodebox.io/status",resources=scheduledscans,verbs=get;update;patch

// Reconcile compares the Service object against the state of the cluster and updates both if needed
func (r *ScanTypeReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := r.Log

	// fetch service
	var scanType executionv1.ScanType
	if err := r.Get(ctx, req.NamespacedName, &scanType); err != nil {
		return ctrl.Result{Requeue: true, RequeueAfter: 3 * time.Second}, client.IgnoreNotFound(err)
	}

	currentScanTypeHash := util.HashScanType(scanType)
	log.V(9).Info("Running ScanTypeReconciler", "scanType", req.Name, "namespace", req.Namespace, "hash", currentScanTypeHash)

	// look for scheduledscans started with the scantype
	var scheduledScans executionv1.ScheduledScanList
	r.List(ctx, &scheduledScans, client.InNamespace(scanType.Namespace))

	shouldRequeue := false

	for _, scheduledScan := range scheduledScans.Items {

		if scheduledScan.Spec.ScanSpec.ScanType != scanType.Name {
			log.V(9).Info("ScanType doesn't match, skipping", "scheduledScan", scheduledScan.Name, "namespace", scheduledScan.Namespace, "scanType", scanType.Name)
			continue
		}
		if scheduledScan.Spec.RetriggerOnScanTypeChange == false {
			log.V(9).Info("ScheduledScan isn't configured for automatic scan retriggering, skipping", "scheduledScan", scheduledScan.Name, "namespace", scheduledScan.Namespace, "scanType", scanType.Name)
			continue
		}
		if scheduledScan.Status.ScanTypeHash == "" {
			log.V(8).Info("ScheduledScan doesn't have a checksum yet.", "scheduledScan", scheduledScan.Name, "namespace", scheduledScan.Namespace, "scanType", scanType.Name)
			shouldRequeue = true
			continue
		}

		log.V(8).Info("Checking if ScheduledScan has to be restarted", "scheduledScan", scheduledScan.Name, "namespace", scheduledScan.Namespace)
		scheduledScanChecksum, err := strconv.ParseUint(scheduledScan.Status.ScanTypeHash, 10, 64)
		if err != nil {
			log.Error(err, "Failed to convert string encoded hash into uint64")
			shouldRequeue = true
			continue
		}

		if scheduledScanChecksum != currentScanTypeHash {
			log.V(4).Info("Retriggering ScheduledScan as the underlying ScanType has been updated.", "checksumForScheduledScan", scheduledScanChecksum, "currentScanTypeHash", currentScanTypeHash, "scheduledScan", scheduledScan.Name, "namespace", scheduledScan.Namespace, "scanType", scanType.Name)

			err := util.RetriggerScheduledScan(ctx, r.Status(), scheduledScan)
			if err != nil {
				return ctrl.Result{
					Requeue:      true,
					RequeueAfter: 10 * time.Second,
				}, err
			}
			r.Recorder.Event(&scheduledScan, "Normal", "Retriggered", "ScheduledScan was retriggered beforehand, as the underlying scanType was updated.")
		} else {
			log.V(9).Info("ScanType and ScheduledScan Checksum match. No reason to restart the ScheduledScan", "checksumForScheduledScan", scheduledScanChecksum, "currentScanTypeHash", currentScanTypeHash, "scheduledScan", scheduledScan.Name, "namespace", scheduledScan.Namespace, "scanType", scanType.Name)
		}
	}

	return ctrl.Result{
		Requeue:      shouldRequeue,
		RequeueAfter: 3 * time.Second,
	}, nil
}

// SetupWithManager sets up the controller and initializes every thing it needs
func (r *ScanTypeReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&executionv1.ScanType{}).
		Complete(r)
}
