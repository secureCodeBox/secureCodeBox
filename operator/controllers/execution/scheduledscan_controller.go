/*
Copyright 2020 iteratec GmbH.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controllers

import (
	"context"
	"fmt"
	"reflect"
	"sort"
	"time"

	"github.com/go-logr/logr"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	executionv1 "github.com/secureCodeBox/secureCodeBox-v2-alpha/apis/execution/v1"
)

// ScheduledScanReconciler reconciles a ScheduledScan object
type ScheduledScanReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=scheduledscans,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=scheduledscans/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=scans,verbs=get;list;create
// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=scans/status,verbs=get

// Reconcile comapares the ScheduledScan Resource with the State of the Cluster and updates both accordingly
func (r *ScheduledScanReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("scheduledscan", req.NamespacedName)

	// get the ScheduledScan
	var scheduledScan executionv1.ScheduledScan
	if err := r.Get(ctx, req.NamespacedName, &scheduledScan); err != nil {
		// we'll ignore not-found errors, since they can't be fixed by an immediate
		// requeue (we'll need to wait for a new notification), and we can get them
		// on deleted requests.
		log.V(7).Info("Unable to fetch ScheduledScan")
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	var childScans executionv1.ScanList
	if err := r.List(ctx, &childScans, client.InNamespace(req.Namespace), client.MatchingFields{ownerKey: req.Name}); err != nil {
		log.Error(err, "unable to list child Scans")
		return ctrl.Result{}, err
	}

	log.Info("Got Scans", "count", len(childScans.Items))

	var completedScans []executionv1.Scan
	for _, scan := range childScans.Items {
		if scan.Status.State == "Done" {
			completedScans = append(completedScans, scan)
		}
	}

	sort.Slice(completedScans, func(i, j int) bool {
		if completedScans[i].Status.StartTime == nil {
			return completedScans[j].Status.StartTime != nil
		}
		return completedScans[i].Status.StartTime.Before(completedScans[j].Status.StartTime)
	})

	if len(completedScans) >= 1 {
		lastFindings := completedScans[len(completedScans)-1].Status.Findings
		if !reflect.DeepEqual(lastFindings, scheduledScan.Status.Findings) {
			log.V(2).Info("Updating ScheduledScans Findings as they appear to have changed")
			scheduledScan.Status.Findings = *lastFindings.DeepCopy()
			if err := r.Status().Update(ctx, &scheduledScan); err != nil {
				log.Error(err, "unable to update ScheduledScan status")
				return ctrl.Result{}, err
			}
		}
	}

	for i, scan := range completedScans {
		if int64(i) >= int64(len(completedScans))-scheduledScan.Spec.HistoryLimit {
			break
		}
		if err := r.Delete(ctx, &scan, client.PropagationPolicy(metav1.DeletePropagationBackground)); (err) != nil {
			log.Error(err, "unable to delete old scan", "scan", scan)
		} else {
			log.V(0).Info("deleted old successful job", "scan", scan)
		}
	}

	log.Info("ScanInterval parsed", "interval", scheduledScan.Spec.Interval)

	var nextSchedule time.Time
	if scheduledScan.Status.LastScheduleTime != nil {
		nextSchedule = scheduledScan.Status.LastScheduleTime.Add(scheduledScan.Spec.Interval.Duration)
	} else {
		nextSchedule = time.Now().Add(-1 * time.Second)
	}

	// check if it is time to start the scans
	if !time.Now().Before(nextSchedule) {
		// It's time!
		log.Info("Should start scans here")

		var scan = &executionv1.Scan{
			ObjectMeta: metav1.ObjectMeta{
				Namespace: scheduledScan.Namespace,
				Labels:    scheduledScan.ObjectMeta.GetLabels(),
			},
			Spec: *scheduledScan.Spec.ScanSpec.DeepCopy(),
		}
		scan.Name = fmt.Sprintf("%s-%d", scheduledScan.Name, nextSchedule.Unix())
		metaNow := metav1.Now()
		scan.Status.StartTime = &metaNow
		if err := ctrl.SetControllerReference(&scheduledScan, scan, r.Scheme); err != nil {
			log.Error(err, "unable to set owner reference on scan")
			return ctrl.Result{}, err
		}

		if err := r.Create(ctx, scan); err != nil {
			log.Error(err, "unable to create Scan for ScheduledScan", "scan", scan)
			return ctrl.Result{}, err
		}

		var now metav1.Time = metav1.Now()
		scheduledScan.Status.LastScheduleTime = &now
		if err := r.Status().Update(ctx, &scheduledScan); err != nil {
			log.Error(err, "unable to update ScheduledScan status")
			return ctrl.Result{}, err
		}

		// Recalculate next schedule
		nextSchedule = time.Now().Add(scheduledScan.Spec.Interval.Duration)
	}

	return ctrl.Result{RequeueAfter: nextSchedule.Sub(time.Now())}, nil
}

// SetupWithManager sets up the controller and initializes every thing it needs
func (r *ScheduledScanReconciler) SetupWithManager(mgr ctrl.Manager) error {
	if err := mgr.GetFieldIndexer().IndexField(&executionv1.Scan{}, ownerKey, func(rawObj runtime.Object) []string {
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
