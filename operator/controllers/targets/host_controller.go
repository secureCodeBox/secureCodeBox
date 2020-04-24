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
	"time"

	"github.com/go-logr/logr"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"

	"sigs.k8s.io/controller-runtime/pkg/client"

	executionv1 "github.com/secureCodeBox/secureCodeBox-v2-alpha/operator/apis/execution/v1"
	targetsv1 "github.com/secureCodeBox/secureCodeBox-v2-alpha/operator/apis/targets/v1"
)

var (
	ownerKey = ".metadata.controller"
	apiGVStr = targetsv1.GroupVersion.String()
)

// HostReconciler reconciles a Host object
type HostReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

type ScanTemplates struct {
	Port     int32
	Type     string
	ScanSpec executionv1.ScanSpec
}

// +kubebuilder:rbac:groups=targets.experimental.securecodebox.io,resources=hosts,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=targets.experimental.securecodebox.io,resources=hosts/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=scheduledscans,verbs=get;list;create
// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=scheduledscans/status,verbs=get

// Reconcile comapares the Host Resource with the State of the Cluster and updates both accordingly
func (r *HostReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("host", req.NamespacedName)

	var host targetsv1.Host
	if err := r.Get(ctx, req.NamespacedName, &host); err != nil {
		// we'll ignore not-found errors, since they can't be fixed by an immediate
		// requeue (we'll need to wait for a new notification), and we can get them
		// on deleted requests.
		log.V(7).Info("Unable to fetch Host")
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	scanTemplates := CreateScanTemplatesForHost(host)

	for _, scanTemplate := range scanTemplates {
		scanName := fmt.Sprintf("%s-%s-%d", host.Name, scanTemplate.ScanSpec.ScanType, scanTemplate.Port)

		var scan executionv1.ScheduledScan
		err := r.Get(ctx, types.NamespacedName{Name: scanName, Namespace: req.Namespace}, &scan)
		if err != nil && apierrors.IsNotFound(err) {
			// Scan doesn't exists yet. Thats allright, as we are going to create it directly after this :)
		} else if err != nil {
			log.Error(err, "Failed to lookup ScheduledScan for Host")
			return ctrl.Result{}, err
		} else {
			log.V(4).Info("Wont create Scan for Host as the Scan already exists", "ScheduledScanName", scanName)
			continue
		}

		scan = executionv1.ScheduledScan{
			ObjectMeta: metav1.ObjectMeta{
				Name:      scanName,
				Namespace: host.Namespace,
			},
			Spec: executionv1.ScheduledScanSpec{
				ScanSpec:     &scanTemplate.ScanSpec,
				Interval:     metav1.Duration{Duration: 24 * time.Hour},
				HistoryLimit: 1,
			},
		}
		if err := ctrl.SetControllerReference(&host, &scan, r.Scheme); err != nil {
			log.Error(err, "unable to set owner reference on ScheduledScan")
			return ctrl.Result{}, err
		}

		if err := r.Create(ctx, &scan); err != nil {
			log.Error(err, "unable to create ScheduledScan for Host", "host", host.Name)
			return ctrl.Result{}, err
		}
		log.Info("Created ScheduledScan for Target", "ScheduledScan", scanName)
	}

	// Update Targets Findings Status
	var childScans executionv1.ScheduledScanList
	if err := r.List(ctx, &childScans, client.InNamespace(req.Namespace), client.MatchingFields{ownerKey: req.Name}); err != nil {
		log.Error(err, "unable to list child ScheduledScans")
		return ctrl.Result{}, err
	}

	totalStats := executionv1.FindingStats{
		Count: 0,
		FindingSeverities: executionv1.FindingSeverities{
			Informational: 0,
			Low:           0,
			Medium:        0,
			High:          0,
		},
		FindingCategories: map[string]uint64{},
	}
	for _, scan := range childScans.Items {
		stats := scan.Status.Findings

		totalStats.Count += stats.Count
		totalStats.FindingSeverities.Informational += stats.FindingSeverities.Informational
		totalStats.FindingSeverities.Low += stats.FindingSeverities.Low
		totalStats.FindingSeverities.Medium += stats.FindingSeverities.Medium
		totalStats.FindingSeverities.High += stats.FindingSeverities.High

		for key, value := range stats.FindingCategories {
			if _, ok := totalStats.FindingCategories[key]; ok {
				totalStats.FindingCategories[key] += value
			} else {
				totalStats.FindingCategories[key] = value
			}
		}
	}

	if !reflect.DeepEqual(host.Status.Findings, totalStats) {
		log.V(0).Info("Updating ScheduledScans Findings as they appear to have changed")
		host.Status.Findings = *totalStats.DeepCopy()
		if err := r.Status().Update(ctx, &host); err != nil {
			log.Error(err, "unable to update Host status")
			return ctrl.Result{}, err
		}
	}

	return ctrl.Result{}, nil
}

// CreateScanTemplatesForHost defines which scans should be created for a Host
func CreateScanTemplatesForHost(host targetsv1.Host) []ScanTemplates {
	var scanTemplates []ScanTemplates

	for _, port := range host.Spec.Ports {
		if port.Type == "ssh" {
			scanTemplates = append(scanTemplates, ScanTemplates{
				Port: port.Port,
				Type: port.Type,
				ScanSpec: executionv1.ScanSpec{
					ScanType:   "ssh-scan",
					Parameters: []string{"--target", host.Spec.Hostname, "--port", fmt.Sprintf("%d", port.Port)},
				},
			})
		}
		if port.Type == "http" || port.Type == "https" {
			scanTemplates = append(scanTemplates, ScanTemplates{
				Port: port.Port,
				Type: port.Type,
				ScanSpec: executionv1.ScanSpec{
					ScanType:   "zap-baseline",
					Parameters: []string{"-t", fmt.Sprintf("%s://%s:%d", port.Type, host.Spec.Hostname, port.Port)},
				},
			})
		}
		if port.Type == "http" || port.Type == "https" {
			scanTemplates = append(scanTemplates, ScanTemplates{
				Port: port.Port,
				Type: port.Type,
				ScanSpec: executionv1.ScanSpec{
					ScanType:   "nikto",
					Parameters: []string{"-h", fmt.Sprintf("%s://%s:%d", port.Type, host.Spec.Hostname, port.Port), "-Tuning", "1,2,3,5,7,b"},
				},
			})
		}
		if port.Type == "https" {
			scanTemplates = append(scanTemplates, ScanTemplates{
				Port: port.Port,
				Type: port.Type,
				ScanSpec: executionv1.ScanSpec{
					ScanType:   "sslyze",
					Parameters: []string{"--regular", fmt.Sprintf("%s:%d", host.Spec.Hostname, port.Port)},
				},
			})
		}
	}

	return scanTemplates
}

// SetupWithManager sets up the controller and initializes every thing it needs
func (r *HostReconciler) SetupWithManager(mgr ctrl.Manager) error {
	if err := mgr.GetFieldIndexer().IndexField(&executionv1.ScheduledScan{}, ownerKey, func(rawObj runtime.Object) []string {
		// grab the scan object, extract the owner...
		scheduledScan := rawObj.(*executionv1.ScheduledScan)
		owner := metav1.GetControllerOf(scheduledScan)
		if owner == nil {
			return nil
		}
		// ...make sure it's a Scan belonging to a Host...
		if owner.APIVersion != apiGVStr || owner.Kind != "Host" {
			return nil
		}

		// ...and if so, return it
		return []string{owner.Name}
	}); err != nil {
		return err
	}

	return ctrl.NewControllerManagedBy(mgr).
		For(&targetsv1.Host{}).
		Owns(&executionv1.ScheduledScan{}).
		Complete(r)
}
