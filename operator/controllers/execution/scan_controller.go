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
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/minio/minio-go/v6"
	executionv1 "github.com/secureCodeBox/secureCodeBox-v2-alpha/apis/execution/v1"
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

// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=scans,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=scans/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=scantypes,verbs=get;list;watch
// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=parsedefinitions,verbs=get;list;watch
// +kubebuilder:rbac:groups=execution.experimental.securecodebox.io,resources=persistenceproviders,verbs=get;list;watch
// +kubebuilder:rbac:groups=batch,resources=jobs,verbs=get;list;watch;create;update;patch;delete
// Permissions needed to create service accounts for lurcher, parser and persistence providers

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
	log.Info("Scan Found", "Type", scan.Spec.ScanType, "State", state)
	switch state {
	case "Init":
		err := r.startScan(&scan)
		if err != nil {
			return ctrl.Result{}, err
		}
	case "Scanning":
		err := r.checkIfScanIsCompleted(&scan)
		if err != nil {
			return ctrl.Result{}, err
		}
	case "ScanCompleted":
		err := r.startParser(&scan)
		if err != nil {
			return ctrl.Result{}, err
		}
	case "Parsing":
		err := r.checkIfParsingIsCompleted(&scan)
		if err != nil {
			return ctrl.Result{}, err
		}
	case "ParseCompleted":
		err := r.startPersistenceProvider(&scan)
		if err != nil {
			return ctrl.Result{}, err
		}
	case "Persisting":
		err := r.checkIfPersistingIsCompleted(&scan)
		if err != nil {
			return ctrl.Result{}, err
		}
	}

	return ctrl.Result{}, nil
}

func (r *ScanReconciler) getJob(name, namespace string) (*batch.Job, error) {
	ctx := context.Background()

	// check if k8s job for scan was already created
	var job batch.Job
	err := r.Get(ctx, types.NamespacedName{Name: name, Namespace: namespace}, &job)
	if apierrors.IsNotFound(err) {
		return nil, nil
	} else if err != nil {
		r.Log.Error(err, "unable to get job")
		return nil, err
	}

	return &job, nil
}

type jobCompletionType string

const (
	completed  jobCompletionType = "Completed"
	failed     jobCompletionType = "Failed"
	incomplete jobCompletionType = "Incomplete"
	unkown     jobCompletionType = "Unkown"
)

func (r *ScanReconciler) checkIfJobIsCompleted(name, namespace string) (jobCompletionType, error) {
	job, err := r.getJob(name, namespace)
	if err != nil {
		return unkown, err
	}
	if job == nil {
		return unkown, errors.New("Both Job and error were nil. This isn't really expected")
	}

	if job.Status.Succeeded != 0 {
		return completed, nil
	}
	if job.Status.Failed != 0 {
		return failed, nil
	}
	return unkown, nil
}

func (r *ScanReconciler) startScan(scan *executionv1.Scan) error {
	ctx := context.Background()
	namespacedName := fmt.Sprintf("%s/%s", scan.Namespace, scan.Name)
	log := r.Log.WithValues("scan_init", namespacedName)

	job, err := r.getJob(fmt.Sprintf("scan-%s", scan.Name), scan.Namespace)
	if err != nil {
		return err
	}
	if job != nil {
		log.V(8).Info("Job already exists. Doesn't need to be created.")
		return nil
	}

	// get the scan template for the scan
	var scanType executionv1.ScanType
	if err := r.Get(ctx, types.NamespacedName{Name: scan.Spec.ScanType, Namespace: scan.Namespace}, &scanType); err != nil {
		// we'll ignore not-found errors, since they can't be fixed by an immediate
		// requeue (we'll need to wait for a new notification), and we can get them
		// on deleted requests.
		log.V(7).Info("Unable to fetch ScanType")
		return fmt.Errorf("No ScanType of type '%s' found", scan.Spec.ScanType)
	}
	log.Info("Matching ScanType Found", "ScanType", scanType.Name)

	rules := []rbacv1.PolicyRule{
		rbacv1.PolicyRule{
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

	job, err = r.constructJobForScan(scan, &scanType)
	if err != nil {
		log.Error(err, "unable to create job object ScanType")
		// we'll ignore not-found errors, since they can't be fixed by an immediate
		// requeue (we'll need to wait for a new notification), and we can get them
		// on deleted requests.
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

	status, err := r.checkIfJobIsCompleted(fmt.Sprintf("scan-%s", scan.Name), scan.Namespace)
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
	// Either Incomplete or Unkown, nothing we can do, other then giving it some more time...
	return nil
}

func (r *ScanReconciler) startParser(scan *executionv1.Scan) error {
	ctx := context.Background()
	namespacedName := fmt.Sprintf("%s/%s", scan.Namespace, scan.Name)
	log := r.Log.WithValues("scan_parse", namespacedName)

	job, err := r.getJob(fmt.Sprintf("parse-%s", scan.Name), scan.Namespace)
	if err != nil {
		return err
	}
	if job != nil {
		log.V(8).Info("Job already exists. Doesn't need to be created.")
		return nil
	}

	parseType := scan.Status.RawResultType

	// get the scan template for the scan
	var parseDefinition executionv1.ParseDefinition
	if err := r.Get(ctx, types.NamespacedName{Name: parseType, Namespace: scan.Namespace}, &parseDefinition); err != nil {
		log.V(7).Info("Unable to fetch ParseDefinition")
		return fmt.Errorf("No ParseDefinition of type '%s' found", parseType)
	}
	log.Info("Matching ParseDefinition Found", "ParseDefinition", parseType)

	bucketName := os.Getenv("S3_BUCKET")
	findingsUploadURL, err := r.MinioClient.PresignedPutObject(bucketName, fmt.Sprintf("scan-%s/findings.json", scan.UID), 12*time.Hour)
	if err != nil {
		r.Log.Error(err, "Could not get presigned url from s3 or compatible storage provider")
		return err
	}
	rawResultDownloadURL, err := r.PresignedGetURL(scan.UID, scan.Status.RawResultFile)
	if err != nil {
		return err
	}

	rules := []rbacv1.PolicyRule{
		rbacv1.PolicyRule{
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

	automountServiceAccountToken := true
	job = &batch.Job{
		ObjectMeta: metav1.ObjectMeta{
			Annotations: make(map[string]string),
			Name:        fmt.Sprintf("parse-%s", scan.Name),
			Namespace:   scan.Namespace,
			Labels: map[string]string{
				"experimental.securecodebox.io/job-type": "parser",
			},
		},
		Spec: batch.JobSpec{
			Template: corev1.PodTemplateSpec{
				Spec: corev1.PodSpec{
					RestartPolicy:      corev1.RestartPolicyNever,
					ServiceAccountName: "parser",
					Containers: []corev1.Container{
						{
							Name:  "parser",
							Image: parseDefinition.Spec.Image,
							Env: []corev1.EnvVar{
								corev1.EnvVar{
									Name: "NAMESPACE",
									ValueFrom: &corev1.EnvVarSource{
										FieldRef: &corev1.ObjectFieldSelector{
											FieldPath: "metadata.namespace",
										},
									},
								},
								corev1.EnvVar{
									Name:  "SCAN_NAME",
									Value: scan.Name,
								},
							},
							Args: []string{
								rawResultDownloadURL,
								findingsUploadURL.String(),
							},
							ImagePullPolicy: "IfNotPresent",
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

	status, err := r.checkIfJobIsCompleted(fmt.Sprintf("scan-%s", scan.Name), scan.Namespace)
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
	bucketName := os.Getenv("S3_BUCKET")

	filename := filepath.Base(scanType.Spec.ExtractResults.Location)
	resultUploadURL, err := r.MinioClient.PresignedPutObject(bucketName, fmt.Sprintf("scan-%s/%s", scan.UID, filename), 12*time.Hour)
	if err != nil {
		r.Log.Error(err, "Could not get presigned url from s3 or compatible storage provider")
		return nil, err
	}

	if len(scanType.Spec.JobTemplate.Spec.Template.Spec.Containers) < 1 {
		return nil, errors.New("ScanType must at least contain one container in which the scanner is running")
	}

	job := &batch.Job{
		ObjectMeta: metav1.ObjectMeta{
			Labels: map[string]string{
				"experimental.securecodebox.io/job-type": "scanner",
			},
			Annotations: make(map[string]string),
			Name:        fmt.Sprintf("scan-%s", scan.Name),
			Namespace:   scan.Namespace,
		},
		Spec: *scanType.Spec.JobTemplate.Spec.DeepCopy(),
	}

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
		return nil, fmt.Errorf("Unkown imagePull Policy for lurcher: %s", lurcherPullPolicyRaw)
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
			resultUploadURL.String(),
		},
		Env: []corev1.EnvVar{
			corev1.EnvVar{
				Name: "NAMESPACE",
				ValueFrom: &corev1.EnvVarSource{
					FieldRef: &corev1.ObjectFieldSelector{
						FieldPath: "metadata.namespace",
					},
				},
			},
		},
		// TODO Assign sane default limits for lurcher
		// Resources: corev1.ResourceRequirements{
		// 	Limits: map[corev1.ResourceName]resource.Quantity{
		// 		"": {
		// 			Format: "",
		// 		},
		// 	},
		// 	Requests: map[corev1.ResourceName]resource.Quantity{
		// 		"": {
		// 			Format: "",
		// 		},
		// 	},
		// },
		VolumeMounts: []corev1.VolumeMount{
			corev1.VolumeMount{
				Name:      "scan-results",
				MountPath: "/home/securecodebox/",
			},
		},
	}

	job.Spec.Template.Spec.Containers = append(job.Spec.Template.Spec.Containers, *lurcherSidecar)

	// for k, v := range cronJob.Spec.JobTemplate.Annotations {
	// 	job.Annotations[k] = v
	// }
	// job.Annotations[scheduledTimeAnnotation] = scheduledTime.Format(time.RFC3339)
	// for k, v := range cronJob.Spec.JobTemplate.Labels {
	// 	job.Labels[k] = v
	// }
	if err := ctrl.SetControllerReference(scan, job, r.Scheme); err != nil {
		return nil, err
	}

	command := append(
		scanType.Spec.JobTemplate.Spec.Template.Spec.Containers[0].Command,
		scan.Spec.Parameters...,
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

// PresignedGetURL returns a presigned URL from the s3 (or compatible) serice.
func (r *ScanReconciler) startPersistenceProvider(scan *executionv1.Scan) error {
	ctx := context.Background()

	var persistenceProviders executionv1.PersistenceProviderList
	if err := r.List(ctx, &persistenceProviders, client.InNamespace(scan.Namespace)); err != nil {
		r.Log.V(7).Info("Unable to fetch PersistenceProvider")
		return err
	}

	if len(persistenceProviders.Items) == 0 {
		r.Log.V(5).Info("Marked scan as done as without running persistence providers as non were configured", "ScanName", scan.Name)
		scan.Status.State = "Done"
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "unable to update Scan status")
			return err
		}
		return nil
	}

	rules := []rbacv1.PolicyRule{
		rbacv1.PolicyRule{
			APIGroups: []string{"execution.experimental.securecodebox.io"},
			Resources: []string{"scans"},
			Verbs:     []string{"get"},
		},
	}
	r.ensureServiceAccountExists(
		scan.Namespace,
		"persistence",
		"PersistenceProvider need to access the current scan to view where its results are stored",
		rules,
	)

	for _, persistenceProvider := range persistenceProviders.Items {
		rawFileURL, err := r.PresignedGetURL(scan.UID, scan.Status.RawResultFile)
		if err != nil {
			return err
		}
		findingsFileURL, err := r.PresignedGetURL(scan.UID, "findings.json")
		if err != nil {
			return err
		}

		standardEnvVars := []corev1.EnvVar{
			corev1.EnvVar{
				Name: "NAMESPACE",
				ValueFrom: &corev1.EnvVarSource{
					FieldRef: &corev1.ObjectFieldSelector{
						FieldPath: "metadata.namespace",
					},
				},
			},
			corev1.EnvVar{
				Name:  "SCAN_NAME",
				Value: scan.Name,
			},
		}

		job := &batch.Job{
			ObjectMeta: metav1.ObjectMeta{
				Annotations: make(map[string]string),
				Name:        fmt.Sprintf("persist-%s", scan.Name),
				Namespace:   scan.Namespace,
				Labels: map[string]string{
					"experimental.securecodebox.io/job-type": "persistence",
				},
			},
			Spec: batch.JobSpec{
				Template: corev1.PodTemplateSpec{
					Spec: corev1.PodSpec{
						ServiceAccountName: "persistence",
						RestartPolicy:      corev1.RestartPolicyNever,
						Containers: []corev1.Container{
							{
								Name:  "persistence",
								Image: persistenceProvider.Spec.Image,
								Args: []string{
									rawFileURL,
									findingsFileURL,
								},
								Env:             append(persistenceProvider.Spec.Env, standardEnvVars...),
								ImagePullPolicy: "IfNotPresent",
							},
						},
					},
				},
				TTLSecondsAfterFinished: nil,
			},
		}
		if err := ctrl.SetControllerReference(scan, job, r.Scheme); err != nil {
			r.Log.Error(err, "Unable to set controllerReference on job", "job", job)
			return err
		}

		if err := r.Create(ctx, job); err != nil {
			r.Log.Error(err, "unable to create Job for Parser", "job", job)
			return err
		}

	}
	scan.Status.State = "Persisting"
	if err := r.Status().Update(ctx, scan); err != nil {
		r.Log.Error(err, "unable to update Scan status")
		return err
	}
	r.Log.Info("Started PersistenceProviders", "PersistenceProviderCount", len(persistenceProviders.Items))
	return nil
}

func allJobsCompleted(jobs *batch.JobList) bool {
	for _, job := range jobs.Items {
		if job.Status.Succeeded == 0 {
			return false
		}
	}
	return true
}

func (r *ScanReconciler) checkIfPersistingIsCompleted(scan *executionv1.Scan) error {
	ctx := context.Background()

	// check if k8s job for scan was already created
	var childPersistenceJobs batch.JobList
	if err := r.List(
		ctx,
		&childPersistenceJobs,
		client.InNamespace(scan.Namespace),
		client.MatchingField(ownerKey, scan.Name),
		client.MatchingLabels{
			"experimental.securecodebox.io/job-type": "persistence",
		},
	); err != nil {
		r.Log.Error(err, "unable to list child jobs")
		return err
	}

	r.Log.V(9).Info("Got related jobs", "count", len(childPersistenceJobs.Items))

	if allJobsCompleted(&childPersistenceJobs) {
		r.Log.V(7).Info("Parsing is completed")
		scan.Status.State = "Done"
		if err := r.Status().Update(ctx, scan); err != nil {
			r.Log.Error(err, "unable to update Scan status")
			return err
		}
	}

	// PersistenceProvider(s) are still running. At least some of them are.
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
				rbacv1.Subject{
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
	port := "443"
	if os.Getenv("S3_PORT") != "" {
		port = os.Getenv("S3_PORT")
	}
	// Only deactivate useSSL when explicitly set to false
	useSSL := true
	if os.Getenv("S3_USE_SSL") == "false" {
		useSSL = false
	}

	// Initialize minio client object.
	minioClient, err := minio.New(fmt.Sprintf("%s:%s", endpoint, port), accessKeyID, secretAccessKey, useSSL)
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
