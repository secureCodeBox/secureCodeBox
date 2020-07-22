package scancontrollers

import (
	"context"
	"fmt"
	"strings"

	executionv1 "github.com/secureCodeBox/secureCodeBox-v2-alpha/operator/apis/execution/v1"
	util "github.com/secureCodeBox/secureCodeBox-v2-alpha/operator/utils"
	batch "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	resource "k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (r *ScanReconciler) startParser(scan *executionv1.Scan) error {
	ctx := context.Background()
	namespacedName := fmt.Sprintf("%s/%s", scan.Namespace, scan.Name)
	log := r.Log.WithValues("scan_parse", namespacedName)

	jobs, err := r.getJobsForScan(scan, client.MatchingLabels{"experimental.securecodebox.io/job-type": "parser"})
	if err != nil {
		return err
	}
	if len(jobs.Items) > 0 {
		log.V(8).Info("Job already exists. Doesn't need to be created.")
		return nil
	}

	parseType := scan.Status.RawResultType

	// get the scan template for the scan
	var parseDefinition executionv1.ParseDefinition
	if err := r.Get(ctx, types.NamespacedName{Name: parseType, Namespace: scan.Namespace}, &parseDefinition); err != nil {
		log.V(7).Info("Unable to fetch ParseDefinition")

		scan.Status.State = "Errored"
		scan.Status.ErrorDescription = fmt.Sprintf("No ParseDefinition for ResultType '%s' found in Scans Namespace.", parseType)
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "unable to update Scan status")
			return err
		}

		return fmt.Errorf("No ParseDefinition of type '%s' found", parseType)
	}
	log.Info("Matching ParseDefinition Found", "ParseDefinition", parseType)

	findingsUploadURL, err := r.PresignedPutURL(scan.UID, "findings.json")
	if err != nil {
		r.Log.Error(err, "Could not get presigned url from s3 or compatible storage provider")
		return err
	}
	rawResultDownloadURL, err := r.PresignedGetURL(scan.UID, scan.Status.RawResultFile)
	if err != nil {
		return err
	}

	rules := []rbacv1.PolicyRule{
		{
			APIGroups: []string{"execution.experimental.securecodebox.io"},
			Resources: []string{"scans/status"},
			Verbs:     []string{"get", "patch"},
		},
	}
	r.ensureServiceAccountExists(
		scan.Namespace,
		"parser",
		"Parser need to access the status of Scans to update how many findings have been identified",
		rules,
	)

	labels := scan.ObjectMeta.DeepCopy().Labels
	if labels == nil {
		labels = make(map[string]string)
	}
	labels["experimental.securecodebox.io/job-type"] = "parser"
	automountServiceAccountToken := true
	var backOffLimit int32 = 3
	job := &batch.Job{
		ObjectMeta: metav1.ObjectMeta{
			Annotations:  make(map[string]string),
			GenerateName: util.TruncateName(fmt.Sprintf("parse-%s", scan.Name)),
			Namespace:    scan.Namespace,
			Labels:       labels,
		},
		Spec: batch.JobSpec{
			BackoffLimit: &backOffLimit,
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Annotations: map[string]string{
						"auto-discovery.experimental.securecodebox.io/ignore": "true",
					},
				},
				Spec: corev1.PodSpec{
					RestartPolicy:      corev1.RestartPolicyNever,
					ServiceAccountName: "parser",
					ImagePullSecrets:   parseDefinition.Spec.ImagePullSecrets,
					Containers: []corev1.Container{
						{
							Name:  "parser",
							Image: parseDefinition.Spec.Image,
							Env: []corev1.EnvVar{
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
							},
							Args: []string{
								rawResultDownloadURL,
								findingsUploadURL,
							},
							ImagePullPolicy: "Always",
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
						},
					},
					AutomountServiceAccountToken: &automountServiceAccountToken,
				},
			},
			TTLSecondsAfterFinished: nil,
		},
	}

	if err := ctrl.SetControllerReference(scan, job, r.Scheme); err != nil {
		return err
	}

	log.V(7).Info("Constructed Job object", "job args", strings.Join(job.Spec.Template.Spec.Containers[0].Args, ", "))

	if err := r.Create(ctx, job); err != nil {
		log.Error(err, "unable to create Job for Parser", "job", job)
		return err
	}

	scan.Status.State = "Parsing"
	if err := r.Status().Update(ctx, scan); err != nil {
		log.Error(err, "unable to update Scan status")
		return err
	}

	log.V(1).Info("created Parse Job for Scan", "job", job)
	return nil
}

func (r *ScanReconciler) checkIfParsingIsCompleted(scan *executionv1.Scan) error {
	ctx := context.Background()

	status, err := r.checkIfJobIsCompleted(scan, client.MatchingLabels{"experimental.securecodebox.io/job-type": "parser"})
	if err != nil {
		return err
	}

	switch status {
	case completed:
		r.Log.V(7).Info("Parsing is completed")
		scan.Status.State = "ParseCompleted"
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "unable to update Scan status")
			return err
		}
	case failed:
		scan.Status.State = "Errored"
		scan.Status.ErrorDescription = "Failed to run the Parser. This is likely a Bug, we would like to know about. Please open up a Issue on GitHub."
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "unable to update Scan status")
			return err
		}
	}

	return nil
}
