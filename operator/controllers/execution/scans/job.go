package scancontrollers

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	executionv1 "github.com/secureCodeBox/secureCodeBox-v2-alpha/operator/apis/execution/v1"
	util "github.com/secureCodeBox/secureCodeBox-v2-alpha/operator/utils"
	batch "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	resource "k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type jobCompletionType string

const (
	completed  jobCompletionType = "Completed"
	failed     jobCompletionType = "Failed"
	incomplete jobCompletionType = "Incomplete"
	unknown    jobCompletionType = "Unknown"
)

func allJobsCompleted(jobs *batch.JobList) jobCompletionType {
	hasCompleted := true

	for _, job := range jobs.Items {
		if job.Status.Failed > 0 {
			return failed
		} else if job.Status.Succeeded == 0 {
			hasCompleted = false
		}
	}

	if hasCompleted {
		return completed
	}
	return incomplete
}

func (r *ScanReconciler) getJobsForScan(scan *executionv1.Scan, labels client.MatchingLabels) (*batch.JobList, error) {
	ctx := context.Background()

	// check if k8s job for scan was already created
	var jobs batch.JobList
	if err := r.List(
		ctx,
		&jobs,
		client.InNamespace(scan.Namespace),
		client.MatchingField(ownerKey, scan.Name),
		labels,
	); err != nil {
		r.Log.Error(err, "Unable to list child jobs")
		return nil, err
	}

	return &jobs, nil
}

func (r *ScanReconciler) checkIfJobIsCompleted(scan *executionv1.Scan, labels client.MatchingLabels) (jobCompletionType, error) {
	jobs, err := r.getJobsForScan(scan, labels)
	if err != nil {
		return unknown, err
	}

	r.Log.V(9).Info("Got related jobs", "count", len(jobs.Items))

	return allJobsCompleted(jobs), nil
}

func (r *ScanReconciler) constructJobForScan(scan *executionv1.Scan, scanType *executionv1.ScanType) (*batch.Job, error) {
	filename := filepath.Base(scanType.Spec.ExtractResults.Location)
	resultUploadURL, err := r.PresignedPutURL(scan.UID, filename)
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
	labels["experimental.securecodebox.io/job-type"] = "scanner"
	job := &batch.Job{
		ObjectMeta: metav1.ObjectMeta{
			Labels:       labels,
			GenerateName: util.TruncateName(fmt.Sprintf("scan-%s", scan.Name)),
			Namespace:    scan.Namespace,
		},
		Spec: *scanType.Spec.JobTemplate.Spec.DeepCopy(),
	}

	podAnnotations := scanType.Spec.JobTemplate.DeepCopy().Annotations
	if podAnnotations == nil {
		podAnnotations = make(map[string]string)
	}
	podAnnotations["experimental.securecodebox.io/job-type"] = "scanner"
	job.Spec.Template.Annotations = podAnnotations

	job.Spec.Template.Spec.ServiceAccountName = "lurcher"

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

	// Get lurcher image config from env
	lurcherImage := os.Getenv("LURCHER_IMAGE")
	if lurcherImage == "" {
		lurcherImage = "scbexperimental/lurcher:latest"
	}
	lurcherPullPolicyRaw := os.Getenv("LURCHER_PULL_POLICY")
	var lurcherPullPolicy corev1.PullPolicy
	switch lurcherPullPolicyRaw {
	case "Always":
		lurcherPullPolicy = corev1.PullAlways
	case "IfNotPresent":
		lurcherPullPolicy = corev1.PullIfNotPresent
	case "Never":
		lurcherPullPolicy = corev1.PullNever
	case "":
		lurcherPullPolicy = corev1.PullAlways
	default:
		return nil, fmt.Errorf("Unknown imagePull Policy for lurcher: %s", lurcherPullPolicyRaw)
	}

	lurcherSidecar := &corev1.Container{
		Name:            "lurcher",
		Image:           lurcherImage,
		ImagePullPolicy: lurcherPullPolicy,
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
	}

	job.Spec.Template.Spec.Containers = append(job.Spec.Template.Spec.Containers, *lurcherSidecar)

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

	// Using command over args
	job.Spec.Template.Spec.Containers[0].Command = command
	job.Spec.Template.Spec.Containers[0].Args = nil

	return job, nil
}
