// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package scancontrollers

import (
	"context"
	"fmt"

	"k8s.io/apimachinery/pkg/labels"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"github.com/secureCodeBox/secureCodeBox/operator/utils"
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
	labelSelector, err := r.getLabelSelector(scan)
	if err != nil {
		return err
	}

	var scanCompletionHooks executionv1.ScanCompletionHookList

	if err := r.List(ctx, &scanCompletionHooks,
		client.InNamespace(scan.Namespace),
		client.MatchingLabelsSelector{Selector: labelSelector},
	); err != nil {
		r.Log.V(7).Info("Unable to fetch ScanCompletionHooks")
		return err
	}

	r.Log.Info("Found ScanCompletionHooks", "ScanCompletionHooks", len(scanCompletionHooks.Items))

	orderedHookStatus := util.FromUnorderedList(scanCompletionHooks.Items)
	scan.Status.OrderedHookStatuses = orderedHookStatus
	scan.Status.State = "HookProcessing"

	if err := r.Status().Update(ctx, scan); err != nil {
		r.Log.Error(err, "unable to update Scan status")
		return err
	}

	return nil
}

func (r *ScanReconciler) migrateHookStatus(scan *executionv1.Scan) error {
	ctx := context.Background()
	var scanCompletionHooks executionv1.ScanCompletionHookList
	r.Log.Info("Starting hook Status field migrations", "ReadAndWriteHookStatus", scan.Status.ReadAndWriteHookStatus)

	if err := r.List(ctx, &scanCompletionHooks, client.InNamespace(scan.Namespace)); err != nil {
		r.Log.V(7).Info("Unable to fetch ScanCompletionHooks")
		return err
	}

	// Add new fields to old ReadAndWriteHookStatus object and convert to pointers
	strSlice := make([]*executionv1.HookStatus, len(scan.Status.ReadAndWriteHookStatus))
	for i := range scan.Status.ReadAndWriteHookStatus {
		strSlice[i] = scan.Status.ReadAndWriteHookStatus[i].DeepCopy() // Keep original ReadAndWriteHookStatus field
		strSlice[i].Priority = 0
		strSlice[i].Type = executionv1.ReadAndWrite
		r.Log.Info("Converted ReadAndWrite hook Status", "Original", scan.Status.ReadAndWriteHookStatus[i], "New", strSlice[i])
	}

	// Construct new ReadOnly HookStatus for OrderedHookStatuses
	var readOnlyHooks []*executionv1.HookStatus
	for _, hook := range scanCompletionHooks.Items {
		if hook.Spec.Type == executionv1.ReadOnly {
			hookStatus := &executionv1.HookStatus{
				HookName: hook.Name,
				Priority: 0,
				Type:     executionv1.ReadOnly,
			}

			if scan.Status.State == "ReadAndWriteHookProcessing" || scan.Status.State == "ReadAndWriteHookCompleted" {
				// ReadOnly hooks should not have started yet, so mark them all as pending
				hookStatus.State = executionv1.Pending
			} else if scan.Status.State == "ReadOnlyHookProcessing" {
				// Had already started ReadOnly hooks and should now check status.
				// No status for ReadOnly in old CRD, so mark everything as InProgress and let processInProgressHook update it later.
				hookStatus.State = executionv1.InProgress
			} else if scan.Status.State == "Done" {
				// Had completely finished
				hookStatus.State = executionv1.Completed
			}

			r.Log.Info("Retrieved new ReadOnly hook Status", "New", hookStatus)

			readOnlyHooks = append(readOnlyHooks, hookStatus)
		}
	}

	scan.Status.OrderedHookStatuses = util.OrderHookStatusesInsideAPrioClass(append(readOnlyHooks, strSlice...))
	if scan.Status.State != "Done" {
		scan.Status.State = "HookProcessing"
	}

	if err := r.Status().Update(ctx, scan); err != nil {
		r.Log.Error(err, "unable to update Scan status")
		return err
	}

	r.Log.Info("Finished hook Status field migrations. ReadOnly hook statuses will be updated later.",
		"ReadAndWriteHookStatus", scan.Status.ReadAndWriteHookStatus,
		"OrderedHookStatuses", scan.Status.OrderedHookStatuses)

	return nil
}

func (r *ScanReconciler) executeHooks(scan *executionv1.Scan) error {
	ctx := context.Background()

	err, currentHooks := utils.CurrentHookGroup(scan.Status.OrderedHookStatuses)

	if err != nil && scan.Status.State == "Errored" {
		r.Log.V(8).Info("Skipping hook execution as it already contains failed hooks.")
		return nil
	} else if err != nil {
		scan.Status.State = "Errored"
		scan.Status.ErrorDescription = fmt.Sprintf("Hook execution failed for a unknown hook. Check the scan.status.hookStatus field for more details")
	} else if err == nil && currentHooks == nil {
		// No hooks left to execute
		scan.Status.State = "Done"
	} else {
		for _, hook := range currentHooks {
			err = r.processHook(scan, hook)

			if err != nil {
				scan.Status.State = "Errored"
				scan.Status.ErrorDescription = fmt.Sprintf("Failed to execute Hook '%s' in job '%s'. Check the logs of the hook for more information.", hook.HookName, hook.JobName)
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

	r.Log.Info("Processing hook", "hook", nonCompletedHook, "jobType", jobType)

	switch nonCompletedHook.State {
	case executionv1.Pending:
		return r.processPendingHook(scan, nonCompletedHook, jobType)
	case executionv1.InProgress:
		return r.processInProgressHook(scan, nonCompletedHook, jobType)
	}
	return nil
}

func (r *ScanReconciler) processPendingHook(scan *executionv1.Scan, status *executionv1.HookStatus, jobType string) error {
	ctx := context.Background()

	var hook executionv1.ScanCompletionHook

	var err error
	err = r.Get(ctx, types.NamespacedName{Name: status.HookName, Namespace: scan.Namespace}, &hook)
	if err != nil {
		r.Log.Error(err, "Failed to get Hook for HookStatus")
		return err
	}

	var jobs *batch.JobList
	jobs, err = r.getJobsForScan(scan, client.MatchingLabels{
		"securecodebox.io/job-type":  jobType,
		"securecodebox.io/hook-name": status.HookName,
	})
	if err != nil {
		return err
	}
	if len(jobs.Items) > 0 {
		// job was already started, setting status to correct jobName and state to ensure it's not overwritten with wrong values
		status.JobName = jobs.Items[0].Name
		status.State = executionv1.InProgress
		return nil
	}

	var rawFileURL string
	rawFileURL, err = r.PresignedGetURL(*scan, scan.Status.RawResultFile, defaultPresignDuration)
	if err != nil {
		return err
	}
	var findingsFileURL string
	findingsFileURL, err = r.PresignedGetURL(*scan, "findings.json", defaultPresignDuration)
	if err != nil {
		return err
	}

	var args = []string{
		rawFileURL,
		findingsFileURL,
	}
	if hook.Spec.Type == executionv1.ReadAndWrite {
		var rawFileUploadURL string
		rawFileUploadURL, err = r.PresignedPutURL(*scan, scan.Status.RawResultFile, defaultPresignDuration)
		if err != nil {
			return err
		}
		var findingsUploadURL string
		findingsUploadURL, err = r.PresignedPutURL(*scan, "findings.json", defaultPresignDuration)
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
		// job was already started, setting status to correct jobName and state to ensure it's not overwritten with wrong values
		status.JobName = jobName
		status.State = executionv1.InProgress
		r.Log.Info("Created job for hook", "hook", status)
		return nil
	}

	return err
}

func (r *ScanReconciler) processInProgressHook(scan *executionv1.Scan, status *executionv1.HookStatus, jobType string) error {
	jobStatus, err := r.checkIfJobIsCompleted(scan, client.MatchingLabels{
		"securecodebox.io/job-type":  jobType,
		"securecodebox.io/hook-name": status.HookName,
	})
	if err != nil {
		r.Log.Error(err, "Failed to check job status for Hook")
		return err
	}
	switch jobStatus {
	case completed:
		// Job is completed => set current Hook to completed
		status.State = executionv1.Completed
	case incomplete:
		// Still waiting for job to finish
	case failed:
		if status.State == executionv1.Pending {
			status.State = executionv1.Cancelled
		} else {
			status.State = executionv1.Failed
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
	resources := corev1.ResourceRequirements{
		Requests: corev1.ResourceList{
			corev1.ResourceCPU:    resource.MustParse("200m"),
			corev1.ResourceMemory: resource.MustParse("100Mi"),
		},
		Limits: corev1.ResourceList{
			corev1.ResourceCPU:    resource.MustParse("400m"),
			corev1.ResourceMemory: resource.MustParse("200Mi"),
		},
	}
	if len(hook.Spec.Resources.Requests) != 0 || len(hook.Spec.Resources.Limits) != 0 {
		resources = hook.Spec.Resources
	}
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
					Labels: map[string]string{
						"app.kubernetes.io/managed-by": "securecodebox",
					},
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
							Resources:       resources,
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

	// Set affinity from Scan, if one is set. Otherwise keep value from template
	if scan.Spec.Affinity != nil {
		job.Spec.Template.Spec.Affinity = scan.Spec.Affinity
	} else {
		job.Spec.Template.Spec.Affinity = hook.Spec.Affinity
	}

	// Replace tolerations from template with those from the scan, if specified.
	// Otherwise, stick to those from the template
	if scan.Spec.Tolerations != nil {
		job.Spec.Template.Spec.Tolerations = scan.Spec.Tolerations
	} else {
		job.Spec.Template.Spec.Tolerations = hook.Spec.Tolerations
	}

	if err := ctrl.SetControllerReference(scan, job, r.Scheme); err != nil {
		r.Log.Error(err, "Unable to set controllerReference on job", "job", job)
		return "", err
	}

	if err := r.Create(ctx, job); err != nil {
		return "", err
	}
	return job.Name, nil
}

func (r *ScanReconciler) getLabelSelector(scan *executionv1.Scan) (labels.Selector, error) {
	hookSelector := scan.Spec.HookSelector
	if hookSelector == nil {
		hookSelector = &metav1.LabelSelector{}
	}
	return metav1.LabelSelectorAsSelector(hookSelector)
}
