/*
Copyright 2020 iteratec GmbH.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controllers

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-logr/logr"
	batch "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	resource "k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/minio/minio-go/v6"
	executionv1 "github.com/secureCodeBox/secureCodeBox-v2-alpha/operator/apis/execution/v1"
	util "github.com/secureCodeBox/secureCodeBox-v2-alpha/operator/utils"
)

// ScanReconciler reconciles a Scan object
type ScanReconciler struct {
	client.Client
	Log         logr.Logger
	Scheme      *runtime.Scheme
	MinioClient minio.Client
}

var (
	ownerKey = ".metadata.controller"
	apiGVStr = executionv1.GroupVersion.String()
)

// Finalizer to delete related files in s3 when the scan gets deleted
// https://kubernetes.io/docs/tasks/access-kubernetes-api/custom-resources/custom-resource-definitions/#finalizers
var s3StorageFinalizer = "s3.storage.experimental.securecodebox.io"

// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=scans,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=scans/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=scantypes,verbs=get;list;watch
// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=parsedefinitions,verbs=get;list;watch
// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=scancompletionhooks,verbs=get;list;watch
// +kubebuilder:rbac:groups=batch,resources=jobs,verbs=get;list;watch;create;update;patch;delete
// Permissions needed to create service accounts for lurcher, parser and scanCompletionHooks

// Pod permission are required to grant these permission to service accounts
// +kubebuilder:rbac:groups=core,resources=pods,verbs=get
// +kubebuilder:rbac:groups=core,resources=serviceaccounts,verbs=get;watch;list;create
// +kubebuilder:rbac:groups=rbac.authorization.k8s.io,resources=roles,verbs=get;watch;list;create
// +kubebuilder:rbac:groups=rbac.authorization.k8s.io,resources=rolebindings,verbs=get;watch;list;create

// Reconcile compares the scan object against the state of the cluster and updates both if needed
func (r *ScanReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("scan", req.NamespacedName)

	// get the scan
	var scan executionv1.Scan
	if err := r.Get(ctx, req.NamespacedName, &scan); err != nil {
		// we'll ignore not-found errors, since they can't be fixed by an immediate
		// requeue (we'll need to wait for a new notification), and we can get them
		// on deleted requests.
		log.V(7).Info("Unable to fetch Scan")
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	state := scan.Status.State
	if state == "" {
		state = "Init"
	}

	log.V(5).Info("Scan Found", "Type", scan.Spec.ScanType, "State", state)

	// Handle Finalizer if the scan is getting deleted
	if !scan.ObjectMeta.DeletionTimestamp.IsZero() {
		if err := r.handleFinalizer(&scan); err != nil {
			r.Log.Error(err, "Failed to run Scan Finalizer")
			return ctrl.Result{}, err
		}
	}

	var err error
	switch state {
	case "Init":
		err = r.startScan(&scan)
	case "Scanning":
		err = r.checkIfScanIsCompleted(&scan)
	case "ScanCompleted":
		err = r.startParser(&scan)
	case "Parsing":
		err = r.checkIfParsingIsCompleted(&scan)
	case "ParseCompleted":
		err = r.setHookStatus(&scan)
	case "ReadAndWriteHookProcessing":
		err = r.executeReadAndWriteHooks(&scan)
	case "ReadAndWriteHookCompleted":
		err = r.startReadOnlyHooks(&scan)
	case "ReadOnlyHookProcessing":
		err = r.checkIfReadOnlyHookIsCompleted(&scan)
	}
	if err != nil {
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

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

// Helper functions to check and remove string from a slice of strings.
func containsString(slice []string, s string) bool {
	for _, item := range slice {
		if item == s {
			return true
		}
	}
	return false
}

func removeString(slice []string, s string) (result []string) {
	for _, item := range slice {
		if item == s {
			continue
		}
		result = append(result, item)
	}
	return
}

var errNotFound = "The specified key does not exist."

func (r *ScanReconciler) handleFinalizer(scan *executionv1.Scan) error {
	if containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizer) {
		bucketName := os.Getenv("S3_BUCKET")
		r.Log.V(0).Info("Deleting External Files from FileStorage", "ScanUID", scan.UID)
		err := r.MinioClient.RemoveObject(bucketName, fmt.Sprintf("scan-%s/%s", scan.UID, scan.Status.RawResultFile))
		if err != nil && err.Error() != errNotFound {
			return err
		}
		err = r.MinioClient.RemoveObject(bucketName, fmt.Sprintf("scan-%s/findings.json", scan.UID))

		if err != nil && err.Error() != errNotFound {
			return err
		}

		scan.ObjectMeta.Finalizers = removeString(scan.ObjectMeta.Finalizers, s3StorageFinalizer)
		if err := r.Update(context.Background(), scan); err != nil {
			return err
		}
	}
	return nil
}

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

// Checking if Parser has completed
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

// PresignedGetURL returns a presigned URL from the s3 (or compatible) serice.
func (r *ScanReconciler) PresignedGetURL(scanID types.UID, filename string) (string, error) {
	bucketName := os.Getenv("S3_BUCKET")

	reqParams := make(url.Values)
	rawResultDownloadURL, err := r.MinioClient.PresignedGetObject(bucketName, fmt.Sprintf("scan-%s/%s", string(scanID), filename), 12*time.Hour, reqParams)
	if err != nil {
		r.Log.Error(err, "Could not get presigned url from s3 or compatible storage provider")
		return "", err
	}
	return rawResultDownloadURL.String(), nil
}

// PresignedPutURL returns a presigned URL from the s3 (or compatible) serice.
func (r *ScanReconciler) PresignedPutURL(scanID types.UID, filename string) (string, error) {
	bucketName := os.Getenv("S3_BUCKET")

	rawResultDownloadURL, err := r.MinioClient.PresignedPutObject(bucketName, fmt.Sprintf("scan-%s/%s", string(scanID), filename), 12*time.Hour)
	if err != nil {
		r.Log.Error(err, "Could not get presigned url from s3 or compatible storage provider")
		return "", err
	}
	return rawResultDownloadURL.String(), nil
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

	rules := []rbacv1.PolicyRule{
		{
			APIGroups: []string{"execution.experimental.securecodebox.io"},
			Resources: []string{"scans"},
			Verbs:     []string{"get", "create", "list"},
		},
	}
	serviceAccountName := "scan-completion-hook"
	r.ensureServiceAccountExists(
		scan.Namespace,
		serviceAccountName,
		"ScanCompletionHooks need to access the current scan to view where its results are stored",
		rules,
	)

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

func containsJobForHook(jobs *batch.JobList, hook executionv1.ScanCompletionHook) bool {
	if len(jobs.Items) == 0 {
		return false
	}

	for _, job := range jobs.Items {
		if job.ObjectMeta.Labels["experimental.securecodebox.io/hook-name"] == hook.Name {
			return true
		}
	}

	return false
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

func (r *ScanReconciler) ensureServiceAccountExists(namespace, serviceAccountName, description string, policyRules []rbacv1.PolicyRule) error {
	ctx := context.Background()

	var serviceAccount corev1.ServiceAccount
	err := r.Get(ctx, types.NamespacedName{Name: serviceAccountName, Namespace: namespace}, &serviceAccount)
	if apierrors.IsNotFound(err) {
		r.Log.Info("Service Account doesn't exist creating now")
		serviceAccount = corev1.ServiceAccount{
			ObjectMeta: metav1.ObjectMeta{
				Name:      serviceAccountName,
				Namespace: namespace,
				Annotations: map[string]string{
					"description": description,
				},
			},
		}
		err := r.Create(ctx, &serviceAccount)
		if err != nil {
			r.Log.Error(err, "Failed to create ServiceAccount")
			return err
		}
	} else if err != nil {
		r.Log.Error(err, "Unexpected error while checking if a ServiceAccount exists")
		return err
	}

	var role rbacv1.Role
	err = r.Get(ctx, types.NamespacedName{Name: serviceAccountName, Namespace: namespace}, &role)
	if apierrors.IsNotFound(err) {
		r.Log.Info("Role doesn't exist creating now")
		role = rbacv1.Role{
			ObjectMeta: metav1.ObjectMeta{
				Name:      serviceAccountName,
				Namespace: namespace,
				Annotations: map[string]string{
					"description": description,
				},
			},
			Rules: policyRules,
		}
		err := r.Create(ctx, &role)
		if err != nil {
			r.Log.Error(err, "Failed to create Role")
			return err
		}
	} else if err != nil {
		r.Log.Error(err, "Unexpected error while checking if a Role exists")
		return err
	}

	var roleBinding rbacv1.RoleBinding
	err = r.Get(ctx, types.NamespacedName{Name: serviceAccountName, Namespace: namespace}, &roleBinding)
	if apierrors.IsNotFound(err) {
		r.Log.Info("RoleBinding doesn't exist creating now")
		roleBinding = rbacv1.RoleBinding{
			ObjectMeta: metav1.ObjectMeta{
				Name:      serviceAccountName,
				Namespace: namespace,
				Annotations: map[string]string{
					"description": description,
				},
			},
			Subjects: []rbacv1.Subject{
				{
					Kind: "ServiceAccount",
					Name: serviceAccountName,
				},
			},
			RoleRef: rbacv1.RoleRef{
				Kind:     "Role",
				Name:     serviceAccountName,
				APIGroup: "rbac.authorization.k8s.io",
			},
		}
		err := r.Create(ctx, &roleBinding)
		if err != nil {
			r.Log.Error(err, "Failed to create RoleBinding")
			return err
		}
	} else if err != nil {
		r.Log.Error(err, "Unexpected error while checking if a RoleBinding exists")
		return err
	}

	return nil
}

func (r *ScanReconciler) initS3Connection() *minio.Client {
	endpoint := os.Getenv("S3_ENDPOINT")
	accessKeyID := os.Getenv("S3_ACCESS_KEY")
	secretAccessKey := os.Getenv("S3_SECRET_KEY")
	if os.Getenv("S3_PORT") != "" {
		endpoint = fmt.Sprintf("%s:%s", endpoint, os.Getenv("S3_PORT"))
	}
	// Only deactivate useSSL when explicitly set to false
	useSSL := true
	if os.Getenv("S3_USE_SSL") == "false" {
		useSSL = false
	}

	// Initialize minio client object.
	minioClient, err := minio.New(endpoint, accessKeyID, secretAccessKey, useSSL)
	if err != nil {
		r.Log.Error(err, "Could not create minio client to communicate with s3 or compatible storage provider")
		panic(err)
	}

	return minioClient
}

// SetupWithManager sets up the controller and initializes every thing it needs
func (r *ScanReconciler) SetupWithManager(mgr ctrl.Manager) error {
	r.MinioClient = *r.initS3Connection()

	// Todo: Better config management

	if err := mgr.GetFieldIndexer().IndexField(&batch.Job{}, ownerKey, func(rawObj runtime.Object) []string {
		// grab the job object, extract the owner...
		job := rawObj.(*batch.Job)
		owner := metav1.GetControllerOf(job)
		if owner == nil {
			return nil
		}
		// ...make sure it's a CronJob...
		if owner.APIVersion != apiGVStr || owner.Kind != "Scan" {
			return nil
		}

		// ...and if so, return it
		return []string{owner.Name}
	}); err != nil {
		return err
	}

	return ctrl.NewControllerManagedBy(mgr).
		For(&executionv1.Scan{}).
		Owns(&batch.Job{}).
		Complete(r)
}

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

func (r *ScanReconciler) createJobForHook(hook *executionv1.ScanCompletionHook, scan *executionv1.Scan, cliArgs []string) (string, error) {
	ctx := context.Background()
	rules := []rbacv1.PolicyRule{
		{
			APIGroups: []string{"execution.experimental.securecodebox.io"},
			Resources: []string{"scans"},
			Verbs:     []string{"get", "list", "create"},
		},
		{
			APIGroups: []string{"execution.experimental.securecodebox.io"},
			Resources: []string{"scans/status"},
			Verbs:     []string{"get", "patch"},
		},
	}
	serviceAccountName := "scan-completion-hook"
	r.ensureServiceAccountExists(
		hook.Namespace,
		serviceAccountName,
		"ScanCompletionHooks need to access the current scan to view where its results are stored",
		rules,
	)

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
		labels["experimental.securecodebox.io/job-type"] = "read-and-write-hook"
	} else if hook.Spec.Type == executionv1.ReadOnly {
		labels["experimental.securecodebox.io/job-type"] = "read-only-hook"
	}
	labels["experimental.securecodebox.io/hook-name"] = hook.Name

	var backOffLimit int32 = 3
	job := &batch.Job{
		ObjectMeta: metav1.ObjectMeta{
			Annotations:  make(map[string]string),
			GenerateName: util.TruncateName(fmt.Sprintf("%s-%s", hook.Name, scan.Name)),
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
					ServiceAccountName: serviceAccountName,
					RestartPolicy:      corev1.RestartPolicyNever,
					ImagePullSecrets:   hook.Spec.ImagePullSecrets,
					Containers: []corev1.Container{
						{
							Name:            "hook",
							Image:           hook.Spec.Image,
							Args:            cliArgs,
							Env:             append(hook.Spec.Env, standardEnvVars...),
							ImagePullPolicy: "IfNotPresent",
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
				},
			},
			TTLSecondsAfterFinished: nil,
		},
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
