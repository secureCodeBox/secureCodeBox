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

	readAndWriteHooks := []executionv1.ScanCompletionHook{}
	// filter all ReadAndWriteHooks in the scamCompletionHooks list
	for _, hook := range scanCompletionHooks.Items {
		if hook.Spec.Type == executionv1.ReadAndWrite {
			readAndWriteHooks = append(readAndWriteHooks, hook)
		}
	}

	r.Log.Info("Found ReadAndWriteHooks", "ReadAndWriteHooks", len(readAndWriteHooks))

	hookStatus := []executionv1.HookStatus{}

	for _, hook := range readAndWriteHooks {
		hookStatus = append(hookStatus, executionv1.HookStatus{
			HookName: hook.Name,
			State:    executionv1.Pending,
		})
	}

	scan.Status.State = "ReadAndWriteHookProcessing"
	scan.Status.ReadAndWriteHookStatus = hookStatus

	if err := r.Status().Update(ctx, scan); err != nil {
		r.Log.Error(err, "unable to update Scan status")
		return err
	}

	return nil
}

func (r *ScanReconciler) executeReadAndWriteHooks(scan *executionv1.Scan) error {
	// Get the first Hook Status which is not completed.
	ctx := context.Background()
	var nonCompletedHook *executionv1.HookStatus

	for _, hook := range scan.Status.ReadAndWriteHookStatus {
		if hook.State != executionv1.Completed {
			nonCompletedHook = &hook
			break
		}
	}

	// If nil then all hooks are done
	if nonCompletedHook == nil {
		scan.Status.State = "ReadAndWriteHookCompleted"
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "unable to update Scan status")
			return err
		}
		return nil
	}

	switch nonCompletedHook.State {
	case executionv1.Pending:
		rawFileURL, err := r.PresignedGetURL(scan.UID, scan.Status.RawResultFile, defaultPresignDuration)
		if err != nil {
			return err
		}
		findingsFileURL, err := r.PresignedGetURL(scan.UID, "findings.json", defaultPresignDuration)
		if err != nil {
			return err
		}

		rawFileUploadURL, err := r.PresignedPutURL(scan.UID, scan.Status.RawResultFile, defaultPresignDuration)
		if err != nil {
			return err
		}
		findingsUploadURL, err := r.PresignedPutURL(scan.UID, "findings.json", defaultPresignDuration)
		if err != nil {
			return err
		}

		var hook executionv1.ScanCompletionHook
		if err := r.Get(ctx, types.NamespacedName{Name: nonCompletedHook.HookName, Namespace: scan.Namespace}, &hook); err != nil {
			r.Log.Error(err, "Failed to get ReadAndWrite Hook for HookStatus")
			return err
		}

		jobs, err := r.getJobsForScan(scan, client.MatchingLabels{
			"securecodebox.io/job-type":  "read-and-write-hook",
			"securecodebox.io/hook-name": nonCompletedHook.HookName,
		})
		if err != nil {
			return err
		}
		if len(jobs.Items) > 0 {
			// Job already exists
			return nil
		}

		jobName, err := r.createJobForHook(
			&hook,
			scan,
			[]string{
				rawFileURL,
				findingsFileURL,
				rawFileUploadURL,
				findingsUploadURL,
			},
		)

		// Update the currently executed hook status to "InProgress"
		err = r.updateHookStatus(scan, executionv1.HookStatus{
			HookName: nonCompletedHook.HookName,
			JobName:  jobName,
			State:    executionv1.InProgress,
		})
		return err
	case executionv1.InProgress:
		jobStatus, err := r.checkIfJobIsCompleted(scan, client.MatchingLabels{
			"securecodebox.io/job-type":  "read-and-write-hook",
			"securecodebox.io/hook-name": nonCompletedHook.HookName,
		})
		if err != nil {
			r.Log.Error(err, "Failed to check job status for ReadAndWrite Hook")
			return err
		}
		switch jobStatus {
		case completed:
			// Job is completed => set current Hook to completed
			err = r.updateHookStatus(scan, executionv1.HookStatus{
				HookName: nonCompletedHook.HookName,
				JobName:  nonCompletedHook.JobName,
				State:    executionv1.Completed,
			})
			return err
		case incomplete:
			// Still waiting for job to finish
			return nil
		case failed:
			for i, hookStatus := range scan.Status.ReadAndWriteHookStatus {
				if hookStatus.HookName == nonCompletedHook.HookName {
					scan.Status.ReadAndWriteHookStatus[i].State = executionv1.Failed
				} else if hookStatus.State == executionv1.Pending {
					scan.Status.ReadAndWriteHookStatus[i].State = executionv1.Cancelled
				}
			}
			scan.Status.State = "Errored"
			scan.Status.ErrorDescription = fmt.Sprintf("Failed to execute ReadAndWrite Hook '%s' in job '%s'. Check the logs of the hook for more information.", nonCompletedHook.HookName, nonCompletedHook.JobName)
			if err := r.Status().Update(ctx, scan); err != nil {
				r.Log.Error(err, "unable to update Scan status")
				return err
			}
		}
	}

	return nil
}

func containsJobForHook(jobs *batch.JobList, hook executionv1.ScanCompletionHook) bool {
	if len(jobs.Items) == 0 {
		return false
	}

	for _, job := range jobs.Items {
		if job.ObjectMeta.Labels["securecodebox.io/hook-name"] == hook.Name {
			return true
		}
	}

	return false
}

func (r *ScanReconciler) startReadOnlyHooks(scan *executionv1.Scan) error {
	ctx := context.Background()

	var scanCompletionHooks executionv1.ScanCompletionHookList

	if err := r.List(ctx, &scanCompletionHooks, client.InNamespace(scan.Namespace)); err != nil {
		r.Log.V(7).Info("Unable to fetch ScanCompletionHooks")
		return err
	}

	r.Log.Info("Found ScanCompletionHooks", "ScanCompletionHooks", len(scanCompletionHooks.Items))

	readOnlyHooks := []executionv1.ScanCompletionHook{}
	// filter all ReadOnlyHooks in the scamCompletionHooks list
	for _, hook := range scanCompletionHooks.Items {
		if hook.Spec.Type == executionv1.ReadOnly {
			readOnlyHooks = append(readOnlyHooks, hook)
		}
	}

	r.Log.Info("Found ReadOnlyHooks", "ReadOnlyHooks", len(readOnlyHooks))

	// If the readOnlyHooks list is empty, nothing more to do
	if len(readOnlyHooks) == 0 {
		r.Log.Info("Marked scan as done as without running ReadOnly hooks as non were configured", "ScanName", scan.Name)
		scan.Status.State = "Done"
		var now metav1.Time = metav1.Now()
		scan.Status.FinishedAt = &now
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "Unable to update Scan status")
			return err
		}
		return nil
	}

	// Get all read-only-hooks for scan to later check that they weren't already created
	jobs, err := r.getJobsForScan(scan, client.MatchingLabels{
		"securecodebox.io/job-type": "read-only-hook",
	})
	if err != nil {
		return err
	}

	for _, hook := range readOnlyHooks {
		// Check if hook was already executed
		if containsJobForHook(jobs, hook) == true {
			r.Log.V(4).Info("Skipping creation of job for hook '%s' as it already exists", hook.Name)
			// Job was already created
			continue
		}

		rawFileURL, err := r.PresignedGetURL(scan.UID, scan.Status.RawResultFile, defaultPresignDuration)
		if err != nil {
			return err
		}
		findingsFileURL, err := r.PresignedGetURL(scan.UID, "findings.json", defaultPresignDuration)
		if err != nil {
			return err
		}

		jobName, err := r.createJobForHook(
			&hook,
			scan,
			[]string{
				rawFileURL,
				findingsFileURL,
			},
		)
		if err != nil {
			r.Log.Error(err, "Unable to create Job for ReadOnlyHook", "job", jobName)
			return err
		}
	}
	scan.Status.State = "ReadOnlyHookProcessing"
	if err := r.Status().Update(ctx, scan); err != nil {
		r.Log.Error(err, "Unable to update Scan status")
		return err
	}
	r.Log.Info("Started ReadOnlyHook", "ReadOnlyHookCount", len(readOnlyHooks))
	return nil
}

func (r *ScanReconciler) checkIfReadOnlyHookIsCompleted(scan *executionv1.Scan) error {
	ctx := context.Background()
	readOnlyHookCompletion, err := r.checkIfJobIsCompleted(scan, client.MatchingLabels{"securecodebox.io/job-type": "read-only-hook"})
	if err != nil {
		return err
	}

	if readOnlyHookCompletion == completed {
		r.Log.V(7).Info("All ReadOnlyHooks have completed")
		scan.Status.State = "Done"
		var now metav1.Time = metav1.Now()
		scan.Status.FinishedAt = &now
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "Unable to update Scan status")
			return err
		}
	} else if readOnlyHookCompletion == failed {
		r.Log.Info("At least one ReadOnlyHook failed")
		scan.Status.State = "Errored"
		scan.Status.ErrorDescription = "At least one ReadOnlyHook failed, check the hooks kubernetes jobs related to the scan for more details."
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "Unable to update Scan status")
			return err
		}
	}

	// ReadOnlyHook(s) are still running. At least some of them are.
	// Waiting until all are done.
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

func (r *ScanReconciler) updateHookStatus(scan *executionv1.Scan, hookStatus executionv1.HookStatus) error {
	for i, hook := range scan.Status.ReadAndWriteHookStatus {
		if hook.HookName == hookStatus.HookName {
			scan.Status.ReadAndWriteHookStatus[i] = hookStatus
			break
		}
	}
	if err := r.Status().Update(context.Background(), scan); err != nil {
		r.Log.Error(err, "unable to update Scan status")
		return err
	}
	return nil
}
