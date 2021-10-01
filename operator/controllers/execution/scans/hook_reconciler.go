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
		hookStatus := executionv1.HookStatus{
			HookName: hook.Name,
			State:    executionv1.Pending,
			Priority: hook.Spec.Priority,
			Type:     hook.Spec.Type,
		}
		if hook.Spec.Type == executionv1.ReadAndWrite {
			scan.Status.ReadAndWriteHookStatus = append(scan.Status.ReadAndWriteHookStatus, &hookStatus)
		} else if hook.Spec.Type == executionv1.ReadOnly {
			scan.Status.ReadOnlyHookStatus = append(scan.Status.ReadOnlyHookStatus, &hookStatus)
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

func getNonCompletedHookPriorityQueue(hooks *[]*executionv1.HookStatus) util.PriorityQueue {
	var priorityQueue = make(util.PriorityQueue, 0)
	for _, hook := range *hooks {
		if hook.State != executionv1.Completed {
			priorityQueueItem := util.PriorityQueueItem{
				Value:    hook,
				Priority: hook.Priority,
			}
			heap.Push(&priorityQueue, &priorityQueueItem)
		}
	}
	return priorityQueue
}

func (r *ScanReconciler) executeReadAndWriteHooks(scan *executionv1.Scan) error {
	ctx := context.Background()

	nonCompletedHooks := getNonCompletedHookPriorityQueue(&scan.Status.ReadAndWriteHookStatus)

	// If nil then all hooks are done
	if len(nonCompletedHooks) == 0 {
		r.Log.Info("All ReadAndWriteHooks have been completed", "ScanName", scan.Name)
		scan.Status.State = "ReadOnlyHookProcessing"
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "Unable to update Scan status")
			return err
		}
	} else if len(nonCompletedHooks) > 0 {
		priorityQueueItem := heap.Pop(&nonCompletedHooks).(*util.PriorityQueueItem)
		hook := priorityQueueItem.Value.(*executionv1.HookStatus)

		err := r.processHook(scan, hook)
		if err != nil {
			return err
		}

		if hook.State == executionv1.Failed || hook.State == executionv1.Cancelled {
			scan.Status.State = "Errored"
			scan.Status.ErrorDescription = fmt.Sprintf("Failed to execute ReadAndWrite Hook '%s' in job '%s'. Check the logs of the hook for more information.", hook.HookName, hook.JobName)
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

	nonCompletedHooks := getNonCompletedHookPriorityQueue(&scan.Status.ReadOnlyHookStatus)

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
		for {
			priorityQueueItem := heap.Pop(&nonCompletedHooks).(*util.PriorityQueueItem)
			hook := priorityQueueItem.Value.(*executionv1.HookStatus)

			err := r.processHook(scan, hook)
			if err != nil {
				return err
			}

			if hook.State == executionv1.Failed || hook.State == executionv1.Cancelled {
				scan.Status.State = "Errored"
				scan.Status.ErrorDescription = fmt.Sprintf("Failed to execute ReadOnly Hook '%s' in job '%s'. Check the logs of the hook for more information.", hook.HookName, hook.JobName)
				if err := r.Status().Update(ctx, scan); err != nil {
					r.Log.Error(err, "unable to update Scan status")
					return err
				}
				return nil
			}

			// Only process hooks with identical priority in parallel
			if nonCompletedHooks.Len() == 0 ||
				nonCompletedHooks.Peek().(*util.PriorityQueueItem).Priority < priorityQueueItem.Priority {
				break
			}
		}
	}

	scan.Status.State = "Completed"
	for _, hook := range nonCompletedHooks {
		if hook.Value.(*executionv1.HookStatus).State != executionv1.Completed {
			scan.Status.State = "ReadOnlyHookProcessing"
			break
		}
	}

	if err := r.Status().Update(ctx, scan); err != nil {
		r.Log.Error(err, "Unable to update Scan status")
		return err
	}

	return nil
}

func (r *ScanReconciler) processHook(scan *executionv1.Scan, nonCompletedHook *executionv1.HookStatus) error {
	ctx := context.Background()

	var jobType string
	if nonCompletedHook.Type == executionv1.ReadOnly {
		jobType = "read-only-hook"
	} else if nonCompletedHook.Type == executionv1.ReadAndWrite {
		jobType = "read-and-write-hook"
	} else {
		return nil
	}

	r.Log.Info(fmt.Sprintf("Processing %s", jobType), "Hook", nonCompletedHook)

	switch nonCompletedHook.State {
	case executionv1.Pending:
		var hook executionv1.ScanCompletionHook
		if err := r.Get(ctx, types.NamespacedName{Name: nonCompletedHook.HookName, Namespace: scan.Namespace}, &hook); err != nil {
			r.Log.Error(err, "Failed to get ReadAndWrite Hook for HookStatus")
			return err
		}

		jobs, err := r.getJobsForScan(scan, client.MatchingLabels{
			"securecodebox.io/job-type":  jobType,
			"securecodebox.io/hook-name": nonCompletedHook.HookName,
		})
		if err != nil {
			return err
		}
		if len(jobs.Items) > 0 {
			// Job already exists
			return nil
		}

		rawFileURL, err := r.PresignedGetURL(scan.UID, scan.Status.RawResultFile, defaultPresignDuration)
		if err != nil {
			return err
		}
		findingsFileURL, err := r.PresignedGetURL(scan.UID, "findings.json", defaultPresignDuration)
		if err != nil {
			return err
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
				return err
			}
			break
		case executionv1.ReadAndWrite:
			rawFileUploadURL, err := r.PresignedPutURL(scan.UID, scan.Status.RawResultFile, defaultPresignDuration)
			if err != nil {
				return err
			}
			findingsUploadURL, err := r.PresignedPutURL(scan.UID, "findings.json", defaultPresignDuration)
			if err != nil {
				return err
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
				return err
			}
			break
		default:
			return nil
		}
		// Update the currently executed hook job name and status to "InProgress"
		nonCompletedHook.JobName = jobName
		nonCompletedHook.State = executionv1.InProgress
		return err
	case executionv1.InProgress:
		jobStatus, err := r.checkIfJobIsCompleted(scan, client.MatchingLabels{
			"securecodebox.io/job-type":  jobType,
			"securecodebox.io/hook-name": nonCompletedHook.HookName,
		})
		if err != nil {
			r.Log.Error(err, "Failed to check job status for Hook")
			return err
		}
		switch jobStatus {
		case completed:
			// Job is completed => set current Hook to completed
			nonCompletedHook.State = executionv1.Completed
			return err
		case incomplete:
			// Still waiting for job to finish
			return nil
		case failed:
			if nonCompletedHook.State == executionv1.Pending {
				nonCompletedHook.State = executionv1.Cancelled
			} else {
				nonCompletedHook.State = executionv1.Failed
			}

			return nil
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
