// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"context"
	"fmt"
	"reflect"
	"regexp"
	"sort"
	"time"

	"github.com/go-logr/logr"
	"github.com/robfig/cron"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/tools/record"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"github.com/secureCodeBox/secureCodeBox/operator/utils"
)

var (
	ownerKey = ".metadata.controller"
	apiGVStr = executionv1.GroupVersion.String()
)

// ScheduledScanReconciler reconciles a ScheduledScan object
type ScheduledScanReconciler struct {
	client.Client
	Log      logr.Logger
	Scheme   *runtime.Scheme
	Recorder record.EventRecorder
}

// +kubebuilder:rbac:groups=execution.securecodebox.io,resources=scheduledscans,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=execution.securecodebox.io,resources=scheduledscans/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=execution.securecodebox.io,resources=scans,verbs=get;list;create
// +kubebuilder:rbac:groups=execution.securecodebox.io,resources=scans/status,verbs=get

// Reconcile comapares the ScheduledScan Resource with the State of the Cluster and updates both accordingly
func (r *ScheduledScanReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := r.Log.WithValues("scheduledscan", req.NamespacedName)

	// get the ScheduledScan
	var scheduledScan executionv1.ScheduledScan
	if err := r.Get(ctx, req.NamespacedName, &scheduledScan); err != nil {
		// we'll ignore not-found errors, since they can't be fixed by an immediate
		// requeue (we'll need to wait for a new notification), and we can get them
		// on deleted requests.
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	var childScans executionv1.ScanList
	if err := r.List(ctx, &childScans, client.InNamespace(req.Namespace), client.MatchingFields{ownerKey: req.Name}); err != nil {
		log.Error(err, "unable to list child Scans")
		return ctrl.Result{}, err
	}
	log.V(8).Info("Got Child Scans for ScheduledScan", "count", len(childScans.Items))

	// Get all completed (successful scans)
	completedScans := getScansWithState(childScans.Items, "Done")

	// Update Finding Summary of scan with the results of the latest successful Scan
	if len(completedScans) >= 1 {
		lastFindings := completedScans[len(completedScans)-1].Status.Findings
		if !reflect.DeepEqual(lastFindings, scheduledScan.Status.Findings) {
			log.V(4).Info("Updating ScheduledScans Findings as they appear to have changed")
			scheduledScan.Status.Findings = *lastFindings.DeepCopy()
			if err := r.Status().Update(ctx, &scheduledScan); err != nil {
				log.Error(err, "unable to update ScheduledScan status")
				return ctrl.Result{}, err
			}
		}
	}

	// Delete Old Failed Scans when exceeding the history limit
	var successfulHistoryLimit int32 = 3
	if scheduledScan.Spec.SuccessfulJobsHistoryLimit != nil {
		successfulHistoryLimit = *scheduledScan.Spec.SuccessfulJobsHistoryLimit
	}
	err := r.deleteOldScans(completedScans, successfulHistoryLimit)
	if err != nil {
		log.Error(err, "Failed to clean up old scan")
		return ctrl.Result{}, err
	}

	// Delete Old Failed Scans when exceeding the history limit
	failedScans := getScansWithState(childScans.Items, "Errored")
	var failedHistoryLimit int32 = 1
	if scheduledScan.Spec.FailedJobsHistoryLimit != nil {
		failedHistoryLimit = *scheduledScan.Spec.FailedJobsHistoryLimit
	}
	err = r.deleteOldScans(failedScans, failedHistoryLimit)
	if err != nil {
		log.Error(err, "Failed to clean up old scan")
		return ctrl.Result{}, err
	}

	// Calculate the next schedule
	nextSchedule, err := getNextSchedule(r, scheduledScan, time.Now())
	if err != nil {
		log.Error(err, "Unable to calculate next schedule")
		return ctrl.Result{}, err
	}

	// check if it is time to start the next Scan
	if !time.Now().Before(nextSchedule) {
		if scheduledScan.Spec.RetriggerOnScanTypeChange == true {
			// generate hash for current state of the configured ScanType
			var scanType executionv1.ScanType
			if err := r.Get(ctx, types.NamespacedName{Name: scheduledScan.Spec.ScanSpec.ScanType, Namespace: scheduledScan.Namespace}, &scanType); err != nil {
				log.V(5).Info("Unable to fetch ScanType for ScheduledScan", "scanType", scanType.Name, "namespace", scanType.Namespace)
				return ctrl.Result{}, client.IgnoreNotFound(err)
			}

			oldScheduledScan := scheduledScan.DeepCopy()
			hash := utils.HashScanType(scanType)
			scheduledScan.Status.ScanTypeHash = fmt.Sprintf("%d", hash)
			log.V(9).Info("Setting hash:", "hash", scheduledScan.Status.ScanTypeHash, "scheduledScan", scheduledScan, "namespace", req.Namespace)
			if err := r.Status().Patch(ctx, &scheduledScan, client.MergeFrom(oldScheduledScan)); err != nil {
				return ctrl.Result{}, fmt.Errorf("Failed to update ScheduledScan with the current ScanType hash: %w", err)
			} else {
				log.V(7).Info("Updated ScanType Hash", "scheduledScan", req.Name, "scanType", scanType.Name, "hash", hash)
			}
		}

		// It's time!
		var scan = &executionv1.Scan{
			ObjectMeta: metav1.ObjectMeta{
				Namespace:   scheduledScan.Namespace,
				Labels:      scheduledScan.ObjectMeta.GetLabels(),
				Annotations: getAnnotationsForScan(scheduledScan),
			},
			Spec: *scheduledScan.Spec.ScanSpec.DeepCopy(),
		}
		scan.Name = fmt.Sprintf("%s-%d", scheduledScan.Name, nextSchedule.Unix())
		if err := ctrl.SetControllerReference(&scheduledScan, scan, r.Scheme); err != nil {
			log.Error(err, "Unable to set owner reference on Scan")
			return ctrl.Result{}, err
		}

		if err := r.Create(ctx, scan); err != nil {
			log.Error(err, "Unable to create Scan for ScheduledScan")
			return ctrl.Result{}, err
		}

		var now metav1.Time = metav1.Now()
		scheduledScan.Status.LastScheduleTime = &now
		if err := r.Status().Update(ctx, &scheduledScan); err != nil {
			log.Error(err, "Unable to update ScheduledScan status")
			return ctrl.Result{}, err
		}

		// Recalculate next schedule
		nextSchedule, err = getNextSchedule(r, scheduledScan, time.Now())
	}

	return ctrl.Result{RequeueAfter: nextSchedule.Sub(time.Now())}, nil
}

func getNextSchedule(r *ScheduledScanReconciler, scheduledScan executionv1.ScheduledScan, now time.Time) (next time.Time, err error) {
	// check if the Cron schedule is set
	if scheduledScan.Spec.Schedule != "" {
		sched, err := cron.ParseStandard(scheduledScan.Spec.Schedule)
		if err != nil {
			r.Recorder.Event(&scheduledScan, "Warning", "ScheduleParseError", fmt.Sprintf("Unparseable schedule %q: %v", scheduledScan.Spec.Schedule, err))
			return time.Time{}, fmt.Errorf("Unparseable schedule %q: %v", scheduledScan.Spec.Schedule, err)
		}

		// for optimization purposes, cheat a bit and start from our last observed run time
		// we could reconstitute this here, but there's not much point, since we've
		// just updated it.
		var earliestTime time.Time
		if scheduledScan.Status.LastScheduleTime != nil {
			earliestTime = scheduledScan.Status.LastScheduleTime.Time
		} else {
			earliestTime = scheduledScan.ObjectMeta.CreationTimestamp.Time
		}
		if earliestTime.After(now) {
			return sched.Next(now), nil
		}
		return sched.Next(earliestTime), nil
	}
	if scheduledScan.Spec.Interval.Duration > 0 {
		var nextSchedule time.Time
		if scheduledScan.Status.LastScheduleTime != nil {
			nextSchedule = scheduledScan.Status.LastScheduleTime.Add(scheduledScan.Spec.Interval.Duration)
		} else {
			nextSchedule = time.Now().Add(-1 * time.Second)
		}
		return nextSchedule, nil
	}
	r.Recorder.Event(&scheduledScan, "Warning", "NoScheduleOrInterval", "No valid schedule or interval found")
	return time.Time{}, fmt.Errorf("No schedule or interval found")
}

// Copy over securecodebox.io annotations from the scheduledScan to the created scan
func getAnnotationsForScan(scheduledScan executionv1.ScheduledScan) map[string]string {
	annotations := map[string]string{}

	if scheduledScan.Annotations == nil {
		return annotations
	}

	re := regexp.MustCompile(`.*securecodebox\.io/.*`)
	for key, value := range scheduledScan.Annotations {
		if matches := re.MatchString(key); matches {
			annotations[key] = value
		}
	}

	return annotations
}

// Returns a sorted list of scans with a matching state
func getScansWithState(scans []executionv1.Scan, state string) []executionv1.Scan {
	// Get a sorted list of scans.
	var newScans []executionv1.Scan
	for _, scan := range scans {
		if scan.Status.State == state {
			newScans = append(newScans, scan)
		}
	}
	sort.Slice(newScans, func(i, j int) bool {
		return newScans[i].ObjectMeta.CreationTimestamp.Before(&newScans[j].ObjectMeta.CreationTimestamp)
	})

	return newScans
}

// DeleteOldScans when exceeding the history limit
func (r *ScheduledScanReconciler) deleteOldScans(scans []executionv1.Scan, maxCount int32) error {
	for i, scan := range scans {
		if int32(i) >= int32(len(scans))-maxCount {
			break
		}
		if err := r.Delete(context.Background(), &scan, client.PropagationPolicy(metav1.DeletePropagationBackground)); (err) != nil {
			return err
		}
	}

	return nil
}

// SetupWithManager sets up the controller and initializes every thing it needs
func (r *ScheduledScanReconciler) SetupWithManager(mgr ctrl.Manager) error {
	// set up a real clock, since we're not in a test
	ctx := context.Background()
	if err := mgr.GetFieldIndexer().IndexField(ctx, &executionv1.Scan{}, ownerKey, func(rawObj client.Object) []string {
		// grab the job object, extract the owner...
		scan := rawObj.(*executionv1.Scan)
		owner := metav1.GetControllerOf(scan)
		if owner == nil {
			return nil
		}
		// ...make sure it's a Scan belonging to a Target...
		if owner.APIVersion != apiGVStr || owner.Kind != "ScheduledScan" {
			return nil
		}

		// ...and if so, return it
		return []string{owner.Name}
	}); err != nil {
		return err
	}

	return ctrl.NewControllerManagedBy(mgr).
		For(&executionv1.ScheduledScan{}).
		Owns(&executionv1.Scan{}).
		Complete(r)
}
