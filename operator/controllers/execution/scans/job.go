package scancontrollers

import (
	"context"

	executionv1 "github.com/secureCodeBox/secureCodeBox-v2-alpha/operator/apis/execution/v1"
	batch "k8s.io/api/batch/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type jobCompletionType string

const (
	completed  jobCompletionType = "Completed"
	failed     jobCompletionType = "Failed"
	incomplete jobCompletionType = "Incomplete"
	unknown    jobCompletionType = "Unknown"
)

func allJobsCompleted(jobs *batch.JobList) jobCompletionType {
	hasCompleted := true

	for _, job := range jobs.Items {
		if job.Status.Failed > 0 {
			return failed
		} else if job.Status.Succeeded == 0 {
			hasCompleted = false
		}
	}

	if hasCompleted {
		return completed
	}
	return incomplete
}

func (r *ScanReconciler) getJobsForScan(scan *executionv1.Scan, labels client.MatchingLabels) (*batch.JobList, error) {
	ctx := context.Background()

	// check if k8s job for scan was already created
	var jobs batch.JobList
	if err := r.List(
		ctx,
		&jobs,
		client.InNamespace(scan.Namespace),
		client.MatchingField(ownerKey, scan.Name),
		labels,
	); err != nil {
		r.Log.Error(err, "Unable to list child jobs")
		return nil, err
	}

	return &jobs, nil
}

func (r *ScanReconciler) checkIfJobIsCompleted(scan *executionv1.Scan, labels client.MatchingLabels) (jobCompletionType, error) {
	jobs, err := r.getJobsForScan(scan, labels)
	if err != nil {
		return unknown, err
	}

	r.Log.V(9).Info("Got related jobs", "count", len(jobs.Items))

	return allJobsCompleted(jobs), nil
}
