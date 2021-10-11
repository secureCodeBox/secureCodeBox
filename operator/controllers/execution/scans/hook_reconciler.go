// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package scancontrollers

import (
	"container/heap"
	"context"
	"fmt"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	util "github.com/secureCodeBox/secureCodeBox/operator/utils"
	batch "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	resource "k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (r *ScanReconciler) setHookStatus(scan *executionv1.Scan) error {
	// Set (pending) Hook status on the scan
	ctx := context.Background()
	var scanCompletionHooks executionv1.ScanCompletionHookList

	if err := r.List(ctx, &scanCompletionHooks, client.InNamespace(scan.Namespace)); err != nil {
		r.Log.V(7).Info("Unable to fetch ScanCompletionHooks")
		return err
	}

	r.Log.Info("Found ScanCompletionHooks", "ScanCompletionHooks", len(scanCompletionHooks.Items))

	for _, hook := range scanCompletionHooks.Items {
		hookStatus := &executionv1.HookStatus{
			HookName: hook.Name,
			State:    executionv1.Pending,
			Type:     hook.Spec.Type,
			Priority: hook.Spec.Priority,
		}
		scan.Status.HookStatuses = append(scan.Status.HookStatuses, hookStatus)
	}

	scan.Status.State = "HookProcessing"

	if err := r.Status().Update(ctx, scan); err != nil {
		r.Log.Error(err, "unable to update Scan status")
		return err
	}

	return nil
}

func (r *ScanReconciler) executeHooks(scan *executionv1.Scan) error {
	ctx := context.Background()

	nonCompletedHooks := util.PriorityQueueFromSlice(
		&scan.Status.HookStatuses,
		func(hook *executionv1.HookStatus) bool {
			return hook.State != executionv1.Completed
		},
	)

	var err error
	// If nil then all hooks are done
	if len(nonCompletedHooks) == 0 {
		r.Log.Info("Marked scan as done as all hooks have completed", "ScanName", scan.Name)
		scan.Status.State = "Done"
		var now = metav1.Now()
		scan.Status.FinishedAt = &now
	} else if len(nonCompletedHooks) > 0 {
		for {
			hook := heap.Pop(&nonCompletedHooks).(*util.PriorityQueueItem).Value

			err = r.processHook(scan, hook)
			if err != nil || hook.State == executionv1.Failed || hook.State == executionv1.Cancelled {
				scan.Status.State = "Errored"
				scan.Status.ErrorDescription = fmt.Sprintf("Failed to execute Hook '%s' in job '%s'. Check the logs of the hook for more information.", hook.HookName, hook.JobName)
				break
			}

			// ReadAndWrite hooks may not be run in parallel
			if nonCompletedHooks.Len() == 0 || hook.Type == executionv1.ReadAndWrite {
				break
			}

			next := nonCompletedHooks.Peek().(*util.PriorityQueueItem).Value
			if next.Priority < hook.Priority {
				break
			}
		}
	}

	if err == nil && scan.Status.State == "HookProcessing" {
		// Check if there are now still incomplete hooks
		scan.Status.State = "Completed"
		for _, hook := range scan.Status.HookStatuses {
			if hook.State != executionv1.Completed {
				scan.Status.State = "HookProcessing"
				break
			}
		}
	}

	if sErr := r.Status().Update(ctx, scan); sErr != nil {
		r.Log.Error(sErr, "Unable to update Scan status")
		return sErr
	}

	return err
}

func (r *ScanReconciler) processHook(scan *executionv1.Scan, nonCompletedHook *executionv1.HookStatus) error {
	var jobType string
	if nonCompletedHook.Type == executionv1.ReadOnly {
		jobType = "read-only-hook"
	} else if nonCompletedHook.Type == executionv1.ReadAndWrite {
		jobType = "read-and-write-hook"
	}

	r.Log.Info(fmt.Sprintf("Processing %s", jobType), "Hook", nonCompletedHook)

	var err error
	switch nonCompletedHook.State {
	case executionv1.Pending:
		err = r.processPendingHook(scan, nonCompletedHook, jobType)
	case executionv1.InProgress:
		err = r.processInProgressHook(scan, nonCompletedHook, jobType)
	}

	if err == nil {
		r.Log.Info(fmt.Sprintf("Processed %s", jobType), "Hook", nonCompletedHook)
	}

	return err
}

func (r *ScanReconciler) processPendingHook(scan *executionv1.Scan, pendingHook *executionv1.HookStatus, jobType string) error {
	ctx := context.Background()

	var hook executionv1.ScanCompletionHook
	var err error
	err = r.Get(ctx, types.NamespacedName{Name: pendingHook.HookName, Namespace: scan.Namespace}, &hook)
	if err != nil {
		r.Log.Error(err, "Failed to get Hook for HookStatus")
		return err
	}

	var jobs *batch.JobList
	jobs, err = r.getJobsForScan(scan, client.MatchingLabels{
		"securecodebox.io/job-type":  jobType,
		"securecodebox.io/hook-name": pendingHook.HookName,
	})
	if err != nil || len(jobs.Items) > 0 {
		return err
	}

	var rawFileURL string
	rawFileURL, err = r.PresignedGetURL(scan.UID, scan.Status.RawResultFile, defaultPresignDuration)
	if err != nil {
		return err
	}
	var findingsFileURL string
	findingsFileURL, err = r.PresignedGetURL(scan.UID, "findings.json", defaultPresignDuration)
	if err != nil {
		return err
	}

	var args = []string{
		rawFileURL,
		findingsFileURL,
	}
	if hook.Spec.Type == executionv1.ReadAndWrite {
		var rawFileUploadURL string
		rawFileUploadURL, err = r.PresignedPutURL(scan.UID, scan.Status.RawResultFile, defaultPresignDuration)
		if err != nil {
			return err
		}
		var findingsUploadURL string
		findingsUploadURL, err = r.PresignedPutURL(scan.UID, "findings.json", defaultPresignDuration)
		if err != nil {
			return err
		}
		args = append(args, rawFileUploadURL, findingsUploadURL)
	}

	var jobName string
	jobName, err = r.createJobForHook(
		&hook,
		scan,
		args,
	)

	if err == nil {
		// Update the currently executed hook job name and status to "InProgress"
		pendingHook.JobName = jobName
		pendingHook.State = executionv1.InProgress
	}

	return err
}

func (r *ScanReconciler) processInProgressHook(scan *executionv1.Scan, inProgressHook *executionv1.HookStatus, jobType string) error {
	jobStatus, err := r.checkIfJobIsCompleted(scan, client.MatchingLabels{
		"securecodebox.io/job-type":  jobType,
		"securecodebox.io/hook-name": inProgressHook.HookName,
	})
	if err != nil {
		r.Log.Error(err, "Failed to check job status for Hook")
		return err
	}
	switch jobStatus {
	case completed:
		// Job is completed => set current Hook to completed
		inProgressHook.State = executionv1.Completed
	case incomplete:
		// Still waiting for job to finish
	case failed:
		if inProgressHook.State == executionv1.Pending {
			inProgressHook.State = executionv1.Cancelled
		} else {
			inProgressHook.State = executionv1.Failed
		}
	}
	return nil
}

func (r *ScanReconciler) createJobForHook(hook *executionv1.ScanCompletionHook, scan *executionv1.Scan, cliArgs []string) (string, error) {
	ctx := context.Background()

	serviceAccountName := "scan-completion-hook"
	if hook.Spec.ServiceAccountName != nil {
		// Hook uses a custom ServiceAccount
		serviceAccountName = *hook.Spec.ServiceAccountName
	} else {
		// Check and create a serviceAccount for the hook in its namespace, if it doesn't already exist.
		rules := []rbacv1.PolicyRule{
			{
				APIGroups: []string{"execution.securecodebox.io"},
				Resources: []string{"scans"},
				Verbs:     []string{"get"},
			},
			{
				APIGroups: []string{"execution.securecodebox.io"},
				Resources: []string{"scans/status"},
				Verbs:     []string{"get", "patch"},
			},
		}

		r.ensureServiceAccountExists(
			hook.Namespace,
			serviceAccountName,
			"ScanCompletionHooks need to access the current scan to view where its results are stored",
			rules,
		)
	}

	standardEnvVars := []corev1.EnvVar{
		{
			Name: "NAMESPACE",
			ValueFrom: &corev1.EnvVarSource{
				FieldRef: &corev1.ObjectFieldSelector{
					FieldPath: "metadata.namespace",
				},
			},
		},
		{
			Name:  "SCAN_NAME",
			Value: scan.Name,
		},
	}

	// Starting a new job based on the current ReadAndWrite Hook
	labels := scan.ObjectMeta.DeepCopy().Labels
	if labels == nil {
		labels = make(map[string]string)
	}
	if hook.Spec.Type == executionv1.ReadAndWrite {
		labels["securecodebox.io/job-type"] = "read-and-write-hook"
	} else if hook.Spec.Type == executionv1.ReadOnly {
		labels["securecodebox.io/job-type"] = "read-only-hook"
	}
	labels["securecodebox.io/hook-name"] = hook.Name

	var backOffLimit int32 = 3
	truePointer := true
	falsePointer := false
	job := &batch.Job{
		ObjectMeta: metav1.ObjectMeta{
			Annotations:  make(map[string]string),
			GenerateName: util.TruncateName(fmt.Sprintf("%s-%s", hook.Name, scan.Name)),
			Namespace:    scan.Namespace,
			Labels:       labels,
		},
		Spec: batch.JobSpec{
			TTLSecondsAfterFinished: hook.Spec.TTLSecondsAfterFinished,
			BackoffLimit:            &backOffLimit,
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Annotations: map[string]string{
						"auto-discovery.securecodebox.io/ignore": "true",
						"sidecar.istio.io/inject":                "false",
					},
				},
				Spec: corev1.PodSpec{
					ServiceAccountName: serviceAccountName,
					RestartPolicy:      corev1.RestartPolicyNever,
					ImagePullSecrets:   hook.Spec.ImagePullSecrets,
					Containers: []corev1.Container{
						{
							Name:            "hook",
							Image:           hook.Spec.Image,
							Args:            cliArgs,
							Env:             append(hook.Spec.Env, standardEnvVars...),
							ImagePullPolicy: hook.Spec.ImagePullPolicy,
							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse("200m"),
									corev1.ResourceMemory: resource.MustParse("100Mi"),
								},
								Limits: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse("400m"),
									corev1.ResourceMemory: resource.MustParse("200Mi"),
								},
							},
							SecurityContext: &corev1.SecurityContext{
								RunAsNonRoot:             &truePointer,
								AllowPrivilegeEscalation: &falsePointer,
								ReadOnlyRootFilesystem:   &truePointer,
								Privileged:               &falsePointer,
								Capabilities: &corev1.Capabilities{
									Drop: []corev1.Capability{"all"},
								},
							},
						},
					},
				},
			},
		},
	}

	r.Log.V(8).Info("Configuring customCACerts for Hook")
	injectCustomCACertsIfConfigured(job)

	// Merge Env from HookTemplate
	job.Spec.Template.Spec.Containers[0].Env = append(
		job.Spec.Template.Spec.Containers[0].Env,

		hook.Spec.Env...,
	)
	// Merge VolumeMounts from HookTemplate
	job.Spec.Template.Spec.Containers[0].VolumeMounts = append(
		job.Spec.Template.Spec.Containers[0].VolumeMounts,
		hook.Spec.VolumeMounts...,
	)
	// Merge Volumes from HookTemplate
	job.Spec.Template.Spec.Volumes = append(
		job.Spec.Template.Spec.Volumes,
		hook.Spec.Volumes...,
	)

	if err := ctrl.SetControllerReference(scan, job, r.Scheme); err != nil {
		r.Log.Error(err, "Unable to set controllerReference on job", "job", job)
		return "", err
	}

	if err := r.Create(ctx, job); err != nil {
		return "", err
	}
	return job.Name, nil
}
