// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package scancontrollers

import (
	"context"
	"fmt"
	"os"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	batch "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type jobCompletionType string

const (
	completed  jobCompletionType = "Completed"
	failed     jobCompletionType = "Failed"
	incomplete jobCompletionType = "Incomplete"
	unknown    jobCompletionType = "Unknown"
)

// checkIfAllJobsCompleted returns `completed` if all jobs of the given jobList are in a successful state, incompleted otherwise.
func checkIfAllJobsCompleted(jobs *batch.JobList) jobCompletionType {
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
		client.MatchingFields{".metadata.controller": scan.Name},
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

	return checkIfAllJobsCompleted(jobs), nil
}

// injectCustomCACertsIfConfigured injects CA Certificates to /etc/ssl/certs/
// currently only supports jobs with a single container
func injectCustomCACertsIfConfigured(job *batch.Job) {
	customCACertificate, isConfigured := os.LookupEnv("CUSTOM_CA_CERTIFICATE_EXISTING_CERTIFICATE")
	if !isConfigured {
		return
	}

	job.Spec.Template.Spec.Volumes = append(job.Spec.Template.Spec.Volumes, corev1.Volume{
		Name: "ca-certificate",
		VolumeSource: corev1.VolumeSource{
			ConfigMap: &corev1.ConfigMapVolumeSource{
				LocalObjectReference: corev1.LocalObjectReference{
					Name: customCACertificate,
				},
			},
		},
	})

	certificateName, hasCertificateName := os.LookupEnv("CUSTOM_CA_CERTIFICATE_NAME")
	if !hasCertificateName {
		panic("Missing CUSTOM_CA_CERTIFICATE_NAME config parameter. Do you have `customCACertificate.certificate` configured you helm values?")
	}
	mountPath := fmt.Sprintf("/etc/ssl/certs/%s", certificateName)

	job.Spec.Template.Spec.Containers[0].VolumeMounts = append(job.Spec.Template.Spec.Containers[0].VolumeMounts, corev1.VolumeMount{
		Name:      "ca-certificate",
		ReadOnly:  true,
		MountPath: mountPath,
		SubPath:   certificateName,
	})

	// Add env var for node.js to load the custom ca certs
	job.Spec.Template.Spec.Containers[0].Env = append(job.Spec.Template.Spec.Containers[0].Env, corev1.EnvVar{
		Name:  "NODE_EXTRA_CA_CERTS",
		Value: mountPath,
	})
}
