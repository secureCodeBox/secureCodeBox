// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package scancontrollers

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

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

func (r *ScanReconciler) startScan(scan *executionv1.Scan) error {
	ctx := context.Background()
	namespacedName := fmt.Sprintf("%s/%s", scan.Namespace, scan.Name)
	log := r.Log.WithValues("scan_init", namespacedName)

	jobs, err := r.getJobsForScan(scan, client.MatchingLabels{"securecodebox.io/job-type": "scanner"})
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
		scan.Status.ErrorDescription = fmt.Sprintf("Configured ScanType '%s' not found in '%s' namespace. You'll likely need to deploy the ScanType.", scan.Spec.ScanType, scan.Namespace)
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
		"lurker",
		"Lurker is used to extract results from secureCodeBox Scans. It needs rights to get and watch the status of pods to see when the scans have finished.",
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

	findingsDownloadURL, err := r.PresignedGetURL(*scan, "findings.json", 7*24*time.Hour)
	if err != nil {
		r.Log.Error(err, "Could not get presigned url from s3 or compatible storage provider")
		return err
	}
	scan.Status.FindingDownloadLink = findingsDownloadURL
	rawResultDownloadURL, err := r.PresignedGetURL(*scan, scan.Status.RawResultFile, 7*24*time.Hour)
	if err != nil {
		return err
	}
	scan.Status.RawResultDownloadLink = rawResultDownloadURL

	findingsHeadURL, err := r.PresignedHeadURL(*scan, "findings.json", 7*24*time.Hour)
	if err != nil {
		r.Log.Error(err, "Could not get presigned head url from s3 or compatible storage provider")
		return err
	}
	scan.Status.FindingHeadLink = findingsHeadURL

	rawResultsHeadURL, err := r.PresignedHeadURL(*scan, scan.Status.RawResultFile, 7*24*time.Hour)
	if err != nil {
		r.Log.Error(err, "Could not get presigned head url from s3 or compatible storage provider")
		return err
	}
	scan.Status.RawResultHeadLink = rawResultsHeadURL

	if err := r.Status().Update(ctx, scan); err != nil {
		log.Error(err, "unable to update Scan status")
		return err
	}

	log.V(7).Info("created Job for Scan", "job", job)
	return nil
}

// Checking if scan has completed
func (r *ScanReconciler) checkIfScanIsCompleted(scan *executionv1.Scan) error {
	ctx := context.Background()

	status, err := r.checkIfJobIsCompleted(scan, client.MatchingLabels{"securecodebox.io/job-type": "scanner"})
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

func (r *ScanReconciler) constructJobForScan(scan *executionv1.Scan, scanType *executionv1.ScanType) (*batch.Job, error) {
	filename := filepath.Base(scanType.Spec.ExtractResults.Location)
	resultUploadURL, err := r.PresignedPutURL(*scan, filename, defaultPresignDuration)
	if err != nil {
		r.Log.Error(err, "Could not get presigned url from s3 or compatible storage provider")
		return nil, err
	}

	if len(scanType.Spec.JobTemplate.Spec.Template.Spec.Containers) < 1 {
		return nil, errors.New("ScanType must at least contain one container in which the scanner is running")
	}

	labels := scan.ObjectMeta.DeepCopy().Labels
	if labels == nil {
		labels = make(map[string]string)
	}
	labels["securecodebox.io/job-type"] = "scanner"
	job := &batch.Job{
		ObjectMeta: metav1.ObjectMeta{
			Labels:       labels,
			GenerateName: util.TruncateName(fmt.Sprintf("scan-%s", scan.Name)),
			Namespace:    scan.Namespace,
		},
		Spec: *scanType.Spec.JobTemplate.Spec.DeepCopy(),
	}

	//add recommend kubernetes "managed by" label, to tell the SCB container autodiscovery to ignore the scan pod
	podLabels := job.Spec.Template.Labels
	if podLabels == nil {
		podLabels = make(map[string]string)
	}
	podLabels["app.kubernetes.io/managed-by"] = "securecodebox"
	job.Spec.Template.Labels = podLabels

	podAnnotations := scanType.Spec.JobTemplate.DeepCopy().Annotations
	if podAnnotations == nil {
		podAnnotations = make(map[string]string)
	}
	podAnnotations["auto-discovery.securecodebox.io/ignore"] = "true"
	// Ensuring that istio doesn't inject a sidecar proxy.
	podAnnotations["sidecar.istio.io/inject"] = "false"
	job.Spec.Template.Annotations = podAnnotations

	if job.Spec.Template.Spec.ServiceAccountName == "" {
		job.Spec.Template.Spec.ServiceAccountName = "lurker"
	}

	// merging volume definition from ScanType (if existing) with standard results volume
	if job.Spec.Template.Spec.Containers[0].VolumeMounts == nil || len(job.Spec.Template.Spec.Containers[0].VolumeMounts) == 0 {
		job.Spec.Template.Spec.Volumes = []corev1.Volume{}
	}
	job.Spec.Template.Spec.Volumes = append(job.Spec.Template.Spec.Volumes, corev1.Volume{
		Name: "scan-results",
		VolumeSource: corev1.VolumeSource{
			EmptyDir: &corev1.EmptyDirVolumeSource{},
		},
	})

	// merging volume mounts (for the primary scanner container) from ScanType (if existing) with standard results volume mount
	if job.Spec.Template.Spec.Containers[0].VolumeMounts == nil || len(job.Spec.Template.Spec.Containers[0].VolumeMounts) == 0 {
		job.Spec.Template.Spec.Containers[0].VolumeMounts = []corev1.VolumeMount{}
	}
	job.Spec.Template.Spec.Containers[0].VolumeMounts = append(
		job.Spec.Template.Spec.Containers[0].VolumeMounts,
		corev1.VolumeMount{
			Name:      "scan-results",
			MountPath: "/home/securecodebox/",
		},
	)

	// Get lurker image config from env
	lurkerImage := os.Getenv("LURKER_IMAGE")
	if lurkerImage == "" {
		lurkerImage = "securecodebox/lurker:latest"
	}
	lurkerPullPolicyRaw := os.Getenv("LURKER_PULL_POLICY")
	var lurkerPullPolicy corev1.PullPolicy
	switch lurkerPullPolicyRaw {
	case "Always":
		lurkerPullPolicy = corev1.PullAlways
	case "IfNotPresent":
		lurkerPullPolicy = corev1.PullIfNotPresent
	case "Never":
		lurkerPullPolicy = corev1.PullNever
	case "":
		lurkerPullPolicy = corev1.PullAlways
	default:
		return nil, fmt.Errorf("Unknown imagePull Policy for lurker: %s", lurkerPullPolicyRaw)
	}

	falsePointer := false
	truePointer := true

	lurkerSidecar := &corev1.Container{
		Name:            "lurker",
		Image:           lurkerImage,
		ImagePullPolicy: lurkerPullPolicy,
		Args: []string{
			"--container",
			job.Spec.Template.Spec.Containers[0].Name,
			"--file",
			scanType.Spec.ExtractResults.Location,
			"--url",
			resultUploadURL,
		},
		Env: []corev1.EnvVar{
			{
				Name: "NAMESPACE",
				ValueFrom: &corev1.EnvVarSource{
					FieldRef: &corev1.ObjectFieldSelector{
						FieldPath: "metadata.namespace",
					},
				},
			},
		},
		Resources: corev1.ResourceRequirements{
			Requests: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("20m"),
				corev1.ResourceMemory: resource.MustParse("20Mi"),
			},
			Limits: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("100m"),
				corev1.ResourceMemory: resource.MustParse("100Mi"),
			},
		},
		VolumeMounts: []corev1.VolumeMount{
			{
				Name:      "scan-results",
				MountPath: "/home/securecodebox/",
				ReadOnly:  true,
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
	}

	customCACertificate, isConfigured := os.LookupEnv("CUSTOM_CA_CERTIFICATE_EXISTING_CERTIFICATE")
	r.Log.Info("Configuring customCACerts for lurker", "customCACertificate", customCACertificate, "isConfigured", isConfigured)
	if customCACertificate != "" {
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

		certificateName := os.Getenv("CUSTOM_CA_CERTIFICATE_NAME")
		lurkerSidecar.VolumeMounts = append(lurkerSidecar.VolumeMounts, corev1.VolumeMount{
			Name:      "ca-certificate",
			ReadOnly:  true,
			MountPath: "/etc/ssl/certs/" + certificateName,
			SubPath:   certificateName,
		})
	}

	job.Spec.Template.Spec.Containers = append(job.Spec.Template.Spec.Containers, *lurkerSidecar)

	if err := ctrl.SetControllerReference(scan, job, r.Scheme); err != nil {
		return nil, err
	}

	command := append(
		scanType.Spec.JobTemplate.Spec.Template.Spec.Containers[0].Command,
		scan.Spec.Parameters...,
	)

	// Merge Env from ScanTemplate with Env defined in scan
	job.Spec.Template.Spec.Containers[0].Env = append(
		job.Spec.Template.Spec.Containers[0].Env,
		scan.Spec.Env...,
	)
	// Merge VolumeMounts from ScanTemplate with VolumeMounts defined in scan
	job.Spec.Template.Spec.Containers[0].VolumeMounts = append(
		job.Spec.Template.Spec.Containers[0].VolumeMounts,
		scan.Spec.VolumeMounts...,
	)
	// Merge Volumes from ScanTemplate with Volumes defined in scan
	job.Spec.Template.Spec.Volumes = append(
		job.Spec.Template.Spec.Volumes,
		scan.Spec.Volumes...,
	)

	// Merge initContainers from ScanTemplate with initContainers defined in scan
	job.Spec.Template.Spec.InitContainers = append(
		job.Spec.Template.Spec.InitContainers,
		scan.Spec.InitContainers...,
	)

	if len(scan.Spec.Resources.Requests) != 0 || len(scan.Spec.Resources.Limits) != 0 {
		job.Spec.Template.Spec.Containers[0].Resources = scan.Spec.Resources
	}

	// Set affinity from ScanTemplate
	if scan.Spec.Affinity != nil {
		job.Spec.Template.Spec.Affinity = scan.Spec.Affinity
	}

	// Replace (not merge!) tolerations from template with those specified in the scan job, if there are any.
	// (otherwise keep those from the template)
	if scan.Spec.Tolerations != nil {
		job.Spec.Template.Spec.Tolerations = scan.Spec.Tolerations
	}

	// Using command over args
	job.Spec.Template.Spec.Containers[0].Command = command
	job.Spec.Template.Spec.Containers[0].Args = nil

	return job, nil
}
