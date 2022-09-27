// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package scancontrollers

import (
	"context"
	"fmt"
	"strings"

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

func (r *ScanReconciler) startParser(scan *executionv1.Scan) error {
	ctx := context.Background()
	namespacedName := fmt.Sprintf("%s/%s", scan.Namespace, scan.Name)
	log := r.Log.WithValues("scan_parse", namespacedName)

	jobs, err := r.getJobsForScan(scan, client.MatchingLabels{"securecodebox.io/job-type": "parser"})
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

	urlExpirationDuration, err := util.GetUrlExpirationDuration(util.ParserController)
	if err != nil {
		r.Log.Error(err, "Failed to parse parser url expiration")
	}

	findingsUploadURL, err := r.PresignedPutURL(scan.UID, "findings.json", urlExpirationDuration)
	if err != nil {
		r.Log.Error(err, "Could not get presigned url from s3 or compatible storage provider")
		return err
	}
	rawResultDownloadURL, err := r.PresignedGetURL(scan.UID, scan.Status.RawResultFile, urlExpirationDuration)
	if err != nil {
		return err
	}

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
		scan.Namespace,
		"parser",
		"Parser need to access the status of Scans to update how many findings have been identified",
		rules,
	)

	labels := scan.ObjectMeta.DeepCopy().Labels
	if labels == nil {
		labels = make(map[string]string)
	}
	labels["securecodebox.io/job-type"] = "parser"
	automountServiceAccountToken := true
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
	if len(parseDefinition.Spec.Resources.Requests) != 0 || len(parseDefinition.Spec.Resources.Limits) != 0 {
		resources = parseDefinition.Spec.Resources
	}

	job := &batch.Job{
		ObjectMeta: metav1.ObjectMeta{
			Annotations:  make(map[string]string),
			GenerateName: util.TruncateName(fmt.Sprintf("parse-%s", scan.Name)),
			Namespace:    scan.Namespace,
			Labels:       labels,
		},
		Spec: batch.JobSpec{
			TTLSecondsAfterFinished: parseDefinition.Spec.TTLSecondsAfterFinished,
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
							ImagePullPolicy: parseDefinition.Spec.ImagePullPolicy,
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
					AutomountServiceAccountToken: &automountServiceAccountToken,
				},
			},
		},
	}

	// Merge Env from ParserTemplate
	job.Spec.Template.Spec.Containers[0].Env = append(
		job.Spec.Template.Spec.Containers[0].Env,
		parseDefinition.Spec.Env...,
	)
	// Merge VolumeMounts from ParserTemplate
	job.Spec.Template.Spec.Containers[0].VolumeMounts = append(
		job.Spec.Template.Spec.Containers[0].VolumeMounts,
		parseDefinition.Spec.VolumeMounts...,
	)
	// Merge Volumes from ParserTemplate
	job.Spec.Template.Spec.Volumes = append(
		job.Spec.Template.Spec.Volumes,
		parseDefinition.Spec.Volumes...,
	)

	// Set affinity based on scan, if defined, or parseDefinition if not overridden by scan
	if scan.Spec.Affinity != nil {
		job.Spec.Template.Spec.Affinity = scan.Spec.Affinity
	} else {
		job.Spec.Template.Spec.Affinity = parseDefinition.Spec.Affinity
	}

	// Set tolerations, either from parseDefinition or from scan
	if scan.Spec.Tolerations != nil {
		job.Spec.Template.Spec.Tolerations = scan.Spec.Tolerations
	} else {
		job.Spec.Template.Spec.Tolerations = parseDefinition.Spec.Tolerations
	}

	r.Log.V(8).Info("Configuring customCACerts for Parser")
	injectCustomCACertsIfConfigured(job)

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

	log.V(7).Info("created Parse Job for Scan", "job", job)
	return nil
}

func (r *ScanReconciler) checkIfParsingIsCompleted(scan *executionv1.Scan) error {
	ctx := context.Background()

	status, err := r.checkIfJobIsCompleted(scan, client.MatchingLabels{"securecodebox.io/job-type": "parser"})
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
