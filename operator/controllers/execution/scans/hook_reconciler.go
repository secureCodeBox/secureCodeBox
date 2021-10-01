// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package scancontrollers

import (
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
	"sort"
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
		hookStatus := executionv1.HookStatus{
			HookName: hook.Name,
			State:    executionv1.Pending,
			Priority: hook.Spec.Priority,
			Type:     hook.Spec.Type,
		}
		if hook.Spec.Type == executionv1.ReadAndWrite {
			scan.Status.ReadAndWriteHookStatus = append(scan.Status.ReadAndWriteHookStatus, hookStatus)
		} else if hook.Spec.Type == executionv1.ReadOnly {
			scan.Status.ReadOnlyHookStatus = append(scan.Status.ReadOnlyHookStatus, hookStatus)
		}
	}

	r.Log.Info("Found ReadAndWrite Hooks", "Hooks", len(scan.Status.ReadAndWriteHookStatus))
	r.Log.Info("Found ReadOnlyHooks", "Hooks", len(scan.Status.ReadOnlyHookStatus))

	scan.Status.State = "ReadAndWriteHookProcessing"

	if err := r.Status().Update(ctx, scan); err != nil {
		r.Log.Error(err, "unable to update Scan status")
		return err
	}

	return nil
}

func getNonCompletedHooks(hooks []executionv1.HookStatus) []executionv1.HookStatus {
	var nonCompletedHooks []executionv1.HookStatus
	for _, hook := range hooks {
		if hook.State != executionv1.Completed {
			nonCompletedHooks = append(nonCompletedHooks, hook)
		}
	}
	return nonCompletedHooks
}

func (r *ScanReconciler) executeReadAndWriteHooks(scan *executionv1.Scan) error {
	ctx := context.Background()

	nonCompletedHooks := getNonCompletedHooks(scan.Status.ReadAndWriteHookStatus)

	// If nil then all hooks are done
	if len(nonCompletedHooks) == 0 {
		r.Log.Info("All ReadAndWriteHooks have been completed", "ScanName", scan.Name)
		scan.Status.State = "ReadOnlyHookProcessing"
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "Unable to update Scan status")
			return err
		}
	} else if len(nonCompletedHooks) > 0 {
		highestPriorityHooks, err := r.getHighestPriorityHooks(nonCompletedHooks, 1)
		if err != nil {
			return err
		}

		updatedHook, err := r.processHook(scan, highestPriorityHooks[0])
		if err != nil {
			return err
		}

		// Update the corresponding status in the Scan object
		for i, hookStatus := range scan.Status.ReadAndWriteHookStatus {
			if hookStatus.HookName == updatedHook.HookName {
				scan.Status.ReadAndWriteHookStatus[i] = *updatedHook
				break
			}
		}

		if updatedHook.State == executionv1.Failed || updatedHook.State == executionv1.Cancelled {
			scan.Status.State = "Errored"
			scan.Status.ErrorDescription = fmt.Sprintf("Failed to execute ReadAndWrite Hook '%s' in job '%s'. Check the logs of the hook for more information.", updatedHook.HookName, updatedHook.JobName)
		}

		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "Unable to update Scan status")
			return err
		}
	}

	return nil
}

func (r *ScanReconciler) executeReadOnlyHooks(scan *executionv1.Scan) error {
	ctx := context.Background()

	var nonCompletedHooks = getNonCompletedHooks(scan.Status.ReadOnlyHookStatus)

	// If nil then all hooks are done
	if len(nonCompletedHooks) == 0 {
		r.Log.Info("Marked scan as done as all hooks have completed", "ScanName", scan.Name)
		scan.Status.State = "Done"
		var now = metav1.Now()
		scan.Status.FinishedAt = &now
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "Unable to update Scan status")
			return err
		}
	} else if len(nonCompletedHooks) > 0 {
		highestPriorityHooks, err := r.getHighestPriorityHooks(nonCompletedHooks, 0)
		if err != nil {
			return err
		}

		for _, hook := range highestPriorityHooks {
			updatedHook, err := r.processHook(scan, hook)
			if err != nil {
				return err
			}

			for i, hookStatus := range scan.Status.ReadOnlyHookStatus {
				if hookStatus.HookName == updatedHook.HookName {
					scan.Status.ReadOnlyHookStatus[i] = *updatedHook
					break
				}
			}

			if updatedHook.State == executionv1.Failed || updatedHook.State == executionv1.Cancelled {
				scan.Status.State = "Errored"
				scan.Status.ErrorDescription = fmt.Sprintf("Failed to execute ReadOnly Hook '%s' in job '%s'. Check the logs of the hook for more information.", updatedHook.HookName, updatedHook.JobName)
				if err := r.Status().Update(ctx, scan); err != nil {
					r.Log.Error(err, "unable to update Scan status")
					return err
				}
				return nil
			}
		}

		r.Log.Info("All ReadOnly have been completed", "ScanName", scan.Name)
		scan.Status.State = "ReadOnlyHookProcessing"
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "Unable to update Scan status")
			return err
		}
	}

	return nil
}

func (r *ScanReconciler) getHighestPriorityHooks(hooks []executionv1.HookStatus, maxConcurrent int) ([]executionv1.HookStatus, error) {
	if len(hooks) == 0 {
		return hooks, nil
	}

	// Sort from high to low priority
	sort.Slice(hooks, func(i, j int) bool {
		return hooks[i].Priority > hooks[j].Priority
	})

	// Find hooks with the highest priority
	var highestPriorityHooks []executionv1.HookStatus
	highestPriorityHooks = append(highestPriorityHooks, hooks[0])
	if len(hooks) > 1 {
		for _, hook := range hooks[1:] {
			// Check if we've reached
			if maxConcurrent == len(highestPriorityHooks) {
				break
			}
			if hook.Priority == highestPriorityHooks[0].Priority {
				highestPriorityHooks = append(highestPriorityHooks, hook)
			} else if hook.Priority < highestPriorityHooks[0].Priority {
				break
			}
		}
	}

	return highestPriorityHooks, nil
}

func (r *ScanReconciler) processHook(scan *executionv1.Scan, nonCompletedHook executionv1.HookStatus) (*executionv1.HookStatus, error) {
	ctx := context.Background()

	var jobType string
	if nonCompletedHook.Type == executionv1.ReadOnly {
		jobType = "read-only-hook"
	} else if nonCompletedHook.Type == executionv1.ReadAndWrite {
		jobType = "read-and-write-hook"
	} else {
		return nil, nil
	}

	r.Log.Info(fmt.Sprintf("Processing %s", jobType), "Hook", nonCompletedHook)

	switch nonCompletedHook.State {
	case executionv1.Pending:
		var hook executionv1.ScanCompletionHook
		if err := r.Get(ctx, types.NamespacedName{Name: nonCompletedHook.HookName, Namespace: scan.Namespace}, &hook); err != nil {
			r.Log.Error(err, "Failed to get ReadAndWrite Hook for HookStatus")
			return nil, err
		}

		jobs, err := r.getJobsForScan(scan, client.MatchingLabels{
			"securecodebox.io/job-type":  jobType,
			"securecodebox.io/hook-name": nonCompletedHook.HookName,
		})
		if err != nil {
			return nil, err
		}
		if len(jobs.Items) > 0 {
			// Job already exists
			return &nonCompletedHook, nil
		}

		rawFileURL, err := r.PresignedGetURL(scan.UID, scan.Status.RawResultFile, defaultPresignDuration)
		if err != nil {
			return &nonCompletedHook, err
		}
		findingsFileURL, err := r.PresignedGetURL(scan.UID, "findings.json", defaultPresignDuration)
		if err != nil {
			return &nonCompletedHook, err
		}

		var jobName string
		switch hook.Spec.Type {
		case executionv1.ReadOnly:
			jobName, err = r.createJobForHook(
				&hook,
				scan,
				[]string{
					rawFileURL,
					findingsFileURL,
				},
			)
			if err != nil {
				return &nonCompletedHook, err
			}
			break
		case executionv1.ReadAndWrite:
			rawFileUploadURL, err := r.PresignedPutURL(scan.UID, scan.Status.RawResultFile, defaultPresignDuration)
			if err != nil {
				return &nonCompletedHook, err
			}
			findingsUploadURL, err := r.PresignedPutURL(scan.UID, "findings.json", defaultPresignDuration)
			if err != nil {
				return &nonCompletedHook, err
			}

			jobName, err = r.createJobForHook(
				&hook,
				scan,
				[]string{
					rawFileURL,
					findingsFileURL,
					rawFileUploadURL,
					findingsUploadURL,
				},
			)
			if err != nil {
				return &nonCompletedHook, err
			}
			break
		default:
			return nil, nil
		}
		// Update the currently executed hook job name and status to "InProgress"
		nonCompletedHook.JobName = jobName
		nonCompletedHook.State = executionv1.InProgress
		return &nonCompletedHook, err
	case executionv1.InProgress:
		jobStatus, err := r.checkIfJobIsCompleted(scan, client.MatchingLabels{
			"securecodebox.io/job-type":  jobType,
			"securecodebox.io/hook-name": nonCompletedHook.HookName,
		})
		if err != nil {
			r.Log.Error(err, "Failed to check job status for Hook")
			return &nonCompletedHook, err
		}
		switch jobStatus {
		case completed:
			// Job is completed => set current Hook to completed
			nonCompletedHook.State = executionv1.Completed
			return &nonCompletedHook, err
		case incomplete:
			// Still waiting for job to finish
			return &nonCompletedHook, nil
		case failed:
			if nonCompletedHook.State == executionv1.Pending {
				nonCompletedHook.State = executionv1.Cancelled
			} else {
				nonCompletedHook.State = executionv1.Failed
			}

			return &nonCompletedHook, nil
		}
	}

	return &nonCompletedHook, nil
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
