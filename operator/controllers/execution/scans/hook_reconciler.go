package scancontrollers

import (
	"context"
	"fmt"

	executionv1 "github.com/secureCodeBox/secureCodeBox-v2-alpha/operator/apis/execution/v1"
	"k8s.io/apimachinery/pkg/types"
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
		rawFileURL, err := r.PresignedGetURL(scan.UID, scan.Status.RawResultFile)
		if err != nil {
			return err
		}
		findingsFileURL, err := r.PresignedGetURL(scan.UID, "findings.json")
		if err != nil {
			return err
		}

		rawFileUploadURL, err := r.PresignedPutURL(scan.UID, scan.Status.RawResultFile)
		if err != nil {
			return err
		}
		findingsUploadURL, err := r.PresignedPutURL(scan.UID, "findings.json")
		if err != nil {
			return err
		}

		var hook executionv1.ScanCompletionHook
		if err := r.Get(ctx, types.NamespacedName{Name: nonCompletedHook.HookName, Namespace: scan.Namespace}, &hook); err != nil {
			r.Log.Error(err, "Failed to get ReadAndWrite Hook for HookStatus")
			return err
		}

		jobs, err := r.getJobsForScan(scan, client.MatchingLabels{
			"experimental.securecodebox.io/job-type":  "read-and-write-hook",
			"experimental.securecodebox.io/hook-name": nonCompletedHook.HookName,
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
			"experimental.securecodebox.io/job-type":  "read-and-write-hook",
			"experimental.securecodebox.io/hook-name": nonCompletedHook.HookName,
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
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "Unable to update Scan status")
			return err
		}
		return nil
	}

	// Get all read-only-hooks for scan to later check that they weren't already created
	jobs, err := r.getJobsForScan(scan, client.MatchingLabels{
		"experimental.securecodebox.io/job-type": "read-only-hook",
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

		rawFileURL, err := r.PresignedGetURL(scan.UID, scan.Status.RawResultFile)
		if err != nil {
			return err
		}
		findingsFileURL, err := r.PresignedGetURL(scan.UID, "findings.json")
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
	readOnlyHookCompletion, err := r.checkIfJobIsCompleted(scan, client.MatchingLabels{"experimental.securecodebox.io/job-type": "read-only-hook"})
	if err != nil {
		return err
	}

	if readOnlyHookCompletion == completed {
		r.Log.V(7).Info("All ReadOnlyHooks have completed")
		scan.Status.State = "Done"
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
