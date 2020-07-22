package scancontrollers

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"

	executionv1 "github.com/secureCodeBox/secureCodeBox-v2-alpha/operator/apis/execution/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (r *ScanReconciler) startScan(scan *executionv1.Scan) error {
	ctx := context.Background()
	namespacedName := fmt.Sprintf("%s/%s", scan.Namespace, scan.Name)
	log := r.Log.WithValues("scan_init", namespacedName)

	jobs, err := r.getJobsForScan(scan, client.MatchingLabels{"experimental.securecodebox.io/job-type": "scanner"})
	if err != nil {
		return err
	}
	if len(jobs.Items) > 0 {
		log.V(8).Info("Job already exists. Doesn't need to be created.")
		return nil
	}

	// Add s3 storage finalizer to scan
	if !containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizer) {
		scan.ObjectMeta.Finalizers = append(scan.ObjectMeta.Finalizers, s3StorageFinalizer)
		if err := r.Update(context.Background(), scan); err != nil {
			return err
		}
	}

	// get the ScanType for the scan
	var scanType executionv1.ScanType
	if err := r.Get(ctx, types.NamespacedName{Name: scan.Spec.ScanType, Namespace: scan.Namespace}, &scanType); err != nil {
		log.V(7).Info("Unable to fetch ScanType")

		scan.Status.State = "Errored"
		scan.Status.ErrorDescription = fmt.Sprintf("Configured ScanType '%s' not found in Scans Namespace. You'll likely need to deploy the ScanType.", scan.Spec.ScanType)
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "unable to update Scan status")
			return err
		}

		return fmt.Errorf("No ScanType of type '%s' found", scan.Spec.ScanType)
	}
	log.Info("Matching ScanType Found", "ScanType", scanType.Name)

	rules := []rbacv1.PolicyRule{
		{
			APIGroups: []string{""},
			Resources: []string{"pods"},
			Verbs:     []string{"get"},
		},
	}
	r.ensureServiceAccountExists(
		scan.Namespace,
		"lurcher",
		"Lurcher is used to extract results from secureCodeBox Scans. It needs rights to get and watch the status of pods to see when the scans have finished.",
		rules,
	)

	job, err := r.constructJobForScan(scan, &scanType)
	if err != nil {
		log.Error(err, "unable to create job object ScanType")
		return err
	}

	log.V(7).Info("Constructed Job object", "job args", strings.Join(job.Spec.Template.Spec.Containers[0].Args, ", "))

	if err := r.Create(ctx, job); err != nil {
		log.Error(err, "unable to create Job for Scan", "job", job)
		return err
	}

	scan.Status.State = "Scanning"
	scan.Status.RawResultType = scanType.Spec.ExtractResults.Type
	scan.Status.RawResultFile = filepath.Base(scanType.Spec.ExtractResults.Location)
	if err := r.Status().Update(ctx, scan); err != nil {
		log.Error(err, "unable to update Scan status")
		return err
	}

	log.V(1).Info("created Job for Scan", "job", job)
	return nil
}

// Checking if scan has completed
func (r *ScanReconciler) checkIfScanIsCompleted(scan *executionv1.Scan) error {
	ctx := context.Background()

	status, err := r.checkIfJobIsCompleted(scan, client.MatchingLabels{"experimental.securecodebox.io/job-type": "scanner"})
	if err != nil {
		return err
	}

	switch status {
	case completed:
		r.Log.V(7).Info("Scan is completed")
		scan.Status.State = "ScanCompleted"
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "unable to update Scan status")
			return err
		}
	case failed:
		scan.Status.State = "Errored"
		scan.Status.ErrorDescription = "Failed to run the Scan Container, check k8s Job and its logs for more details"
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "unable to update Scan status")
			return err
		}
	}
	// Either Incomplete or Unknown, nothing we can do, other then giving it some more time...
	return nil
}
