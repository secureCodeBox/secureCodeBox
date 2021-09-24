// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"context"
	"fmt"
	"strconv"

	"github.com/go-logr/logr"
	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"
	util "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/pkg/util"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"

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
	Config   configv1.AutoDiscoveryConfig
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
		log.V(7).Info("Unable to fetch ScanType", "scanType", scanType.Name, "namespace", scanType.Namespace)
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	currentScanTypeHash := util.HashScanType(scanType)
	log.V(0).Info("Something happened to a scanType", "scanType", req.Name, "namespace", req.Namespace, "hash", currentScanTypeHash)

	// look for scheduledscans started with the scantype
	var scheduledScans executionv1.ScheduledScanList
	r.List(ctx, &scheduledScans, client.InNamespace(scanType.Namespace), client.MatchingLabels(map[string]string{
		"app.kubernetes.io/managed-by": "securecodebox-autodiscovery",
	}))

	for _, scheduledScan := range scheduledScans.Items {
		if scheduledScan.Spec.ScanSpec.ScanType != scanType.Name {
			log.V(0).Info("ScanType doesn't match, skipping", "scheduledScan", scheduledScan.Name, "namespace", scheduledScan.Namespace, "scanType", scanType.Name)
		}
		log.V(0).Info("Checking if ScheduledScan has to be restarted", "scheduledScan", scheduledScan.Name, "namespace", scheduledScan.Namespace)

		scheduledScanChecksum := uint64(0)
		if scheduledScan.Annotations != nil {
			if checksum, exists := scheduledScan.ObjectMeta.Annotations["checksum.auto-discovery.securecodebox.io/scantype"]; exists {
				parsedChecksum, err := strconv.ParseUint(checksum, 10, 64)
				scheduledScanChecksum = parsedChecksum
				if err != nil {
					log.Error(fmt.Errorf("Failed to parse checksum: encoded in ScheduledScans annotations: %w", err), "Checksum will be treated as non existstent and scan will be restarted!")
				}
			}
		}

		if scheduledScanChecksum != currentScanTypeHash {
			log.V(0).Info("Checksums don't match, Scan has to be restarted.", "checksumForScheduledScan", scheduledScanChecksum, "currentScanTypeHash", currentScanTypeHash, "scheduledScan", scheduledScan.Name, "namespace", scheduledScan.Namespace, "scanType", scanType.Name)

			err := restartScheduledScan(ctx, r.Status(), scheduledScan)
			if err != nil {
				return ctrl.Result{
					Requeue:      true,
					RequeueAfter: r.Config.ServiceAutoDiscoveryConfig.PassiveReconcileInterval.Duration,
				}, err
			}
			r.Recorder.Event(&scheduledScan, "Normal", "Retriggered", "ScheduledScan was retriggered beforehand, as the underlying scanType was updated.")
		} else {
			log.V(0).Info("ScanType and ScheduledScan Checksum match. No reason to restart the ScheduledScan", "checksumForScheduledScan", scheduledScanChecksum, "currentScanTypeHash", currentScanTypeHash, "scheduledScan", scheduledScan.Name, "namespace", scheduledScan.Namespace, "scanType", scanType.Name)
		}
	}

	return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller and initializes every thing it needs
func (r *ScanTypeReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&executionv1.ScanType{}).
		Complete(r)
}
