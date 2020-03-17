/*


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
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	scansv1 "experimental.securecodebox.io/api/v1"
	"github.com/minio/minio-go/v6"
)

var (
	ownerKey = ".metadata.controller"
	apiGVStr = scansv1.GroupVersion.String()
)

// ScanReconciler reconciles a Scan object
type ScanReconciler struct {
	client.Client
	Log         logr.Logger
	Scheme      *runtime.Scheme
	MinioClient minio.Client
}

// +kubebuilder:rbac:groups=scans.experimental.securecodebox.io,resources=scans,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=scans.experimental.securecodebox.io,resources=scans/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=scans.experimental.securecodebox.io,resources=scantemplates,verbs=get;list;watch
// +kubebuilder:rbac:groups=scans.experimental.securecodebox.io,resources=parsedefinitions,verbs=get;list;watch
// +kubebuilder:rbac:groups=batch,resources=jobs,verbs=get;list;watch;create;update;patch;delete

func (r *ScanReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("scan", req.NamespacedName)

	// get the scan
	var scan scansv1.Scan
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

func (r *ScanReconciler) startScan(scan *scansv1.Scan) error {
	ctx := context.Background()
	namespacedName := fmt.Sprintf("%s/%s", scan.Namespace, scan.Name)
	log := r.Log.WithValues("scan_init", namespacedName)

	// get the scan template for the scan
	var scanTemplate scansv1.ScanTemplate
	if err := r.Get(ctx, types.NamespacedName{Name: scan.Spec.ScanType, Namespace: scan.Namespace}, &scanTemplate); err != nil {
		// we'll ignore not-found errors, since they can't be fixed by an immediate
		// requeue (we'll need to wait for a new notification), and we can get them
		// on deleted requests.
		log.V(7).Info("Unable to fetch ScanTemplate")
		return fmt.Errorf("No ScanTemplate of type '%s' found", scan.Spec.ScanType)
	}
	log.Info("Matching ScanTemplate Found", "ScanTemplate", scanTemplate.Name)

	job, err := r.constructJobForCronJob(scan, &scanTemplate)
	if err != nil {
		log.Error(err, "unable to create job object ScanTemplate")
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
	scan.Status.RawResultType = scanTemplate.Spec.ExtractResults.Type
	scan.Status.RawResultFile = filepath.Base(scanTemplate.Spec.ExtractResults.Location)
	if err := r.Status().Update(ctx, scan); err != nil {
		log.Error(err, "unable to update Scan status")
		return err
	}

	log.V(1).Info("created Job for Scan", "job", job)
	return nil
}

func (r *ScanReconciler) checkIfScanIsCompleted(scan *scansv1.Scan) error {
	ctx := context.Background()
	namespacedName := fmt.Sprintf("%s/%s", scan.Namespace, scan.Name)
	log := r.Log.WithValues("scan_done_check", namespacedName)

	// check if k8s job for scan was already created
	var childJobs batch.JobList
	if err := r.List(
		ctx,
		&childJobs,
		client.InNamespace(scan.Namespace),
		client.MatchingField(ownerKey, scan.Name),
		client.MatchingLabels{
			"experimental.securecodebox.io/job-type": "scanner",
		},
	); err != nil {
		log.Error(err, "unable to list child Pods")
		return err
	}

	// TODO: What if the Pod doesn't match our spec? Recreate?

	log.V(9).Info("Got related jobs", "count", len(childJobs.Items))

	if len(childJobs.Items) == 0 {
		// Unexpected. Job should exisit in Scanning State. Resetting to Init
		scan.Status.State = "Init"
		if err := r.Status().Update(ctx, scan); err != nil {
			log.Error(err, "unable to update Scan status")
			return err
		}
		return nil
	} else if len(childJobs.Items) > 1 {
		// yoo that wasn't expected
		return errors.New("Scan had more than one job. Thats not expected")
	}

	// Job exists as expected
	job := childJobs.Items[0]

	// Checking if scan has completed
	// TODO: Handle scan job failure cases
	if job.Status.Succeeded != 0 {
		log.V(7).Info("Scan is completed")
		scan.Status.State = "ScanCompleted"
		if err := r.Status().Update(ctx, scan); err != nil {
			log.Error(err, "unable to update Scan status")
			return err
		}
	}
	return nil
}

func (r *ScanReconciler) startParser(scan *scansv1.Scan) error {
	ctx := context.Background()
	namespacedName := fmt.Sprintf("%s/%s", scan.Namespace, scan.Name)
	log := r.Log.WithValues("scan_parse", namespacedName)

	parseType := scan.Status.RawResultType

	// get the scan template for the scan
	var parseDefinition scansv1.ParseDefinition
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

	automountServiceAccountToken := false
	job := &batch.Job{
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
					RestartPolicy: corev1.RestartPolicyNever,
					Containers: []corev1.Container{
						{
							Name:  "parser",
							Image: parseDefinition.Spec.Image,
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

func (r *ScanReconciler) checkIfParsingIsCompleted(scan *scansv1.Scan) error {
	ctx := context.Background()
	namespacedName := fmt.Sprintf("%s/%s", scan.Namespace, scan.Name)
	log := r.Log.WithValues("scan_done_check", namespacedName)

	// check if k8s job for scan was already created
	var childJobs batch.JobList
	if err := r.List(
		ctx,
		&childJobs,
		client.InNamespace(scan.Namespace),
		client.MatchingField(ownerKey, scan.Name),
		client.MatchingLabels{
			"experimental.securecodebox.io/job-type": "parser",
		},
	); err != nil {
		log.Error(err, "unable to list child jobs")
		return err
	}

	log.V(9).Info("Got related jobs", "count", len(childJobs.Items))

	if len(childJobs.Items) == 0 {
		// Unexpected. Job should exist in "Parsing" State. Resetting to Init
		log.Info("Scan is in Parsing State but doesn't have a associated Parse Job running. Resetting status to 'ScanCompleted'")
		scan.Status.State = "ScanCompleted"
		if err := r.Status().Update(ctx, scan); err != nil {
			log.Error(err, "unable to update Scan status")
			return err
		}
		return nil
	} else if len(childJobs.Items) > 1 {
		// yoo that wasn't expected
		return errors.New("Scan had more than one parse job. Thats not expected")
	}

	// Job exists as expected
	job := childJobs.Items[0]

	// Checking if parsing has completed
	// TODO: Handle parse job failure cases
	if job.Status.Succeeded != 0 {
		log.V(7).Info("Parsing is completed")
		scan.Status.State = "ParseCompleted"
		if err := r.Status().Update(ctx, scan); err != nil {
			log.Error(err, "unable to update Scan status")
			return err
		}
	}
	return nil
}

func (r *ScanReconciler) constructJobForCronJob(scan *scansv1.Scan, scanTemplate *scansv1.ScanTemplate) (*batch.Job, error) {
	// We want job names for a given nominal start time to have a deterministic name to avoid the same job being created twice

	bucketName := os.Getenv("S3_BUCKET")

	filename := filepath.Base(scanTemplate.Spec.ExtractResults.Location)
	resultUploadUrl, err := r.MinioClient.PresignedPutObject(bucketName, fmt.Sprintf("scan-%s/%s", scan.UID, filename), 12*time.Hour)
	if err != nil {
		r.Log.Error(err, "Could not get presigned url from s3 or compatible storage provider")
		return nil, err
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
		Spec: *scanTemplate.Spec.JobTemplate.Spec.DeepCopy(),
	}

	job.Spec.Template.Spec.ServiceAccountName = "lurcher"

	job.Spec.Template.Spec.Volumes = []corev1.Volume{
		corev1.Volume{
			Name: "scan-results",
			VolumeSource: corev1.VolumeSource{
				EmptyDir: &corev1.EmptyDirVolumeSource{},
			},
		},
	}

	var containerVolumeMounts []corev1.VolumeMount
	if job.Spec.Template.Spec.Containers[0].VolumeMounts == nil || len(job.Spec.Template.Spec.Containers[0].VolumeMounts) == 0 {
		containerVolumeMounts = []corev1.VolumeMount{}
	} else {
		containerVolumeMounts = job.Spec.Template.Spec.Containers[0].VolumeMounts
	}
	job.Spec.Template.Spec.Containers[0].VolumeMounts = append(containerVolumeMounts, []corev1.VolumeMount{corev1.VolumeMount{
		Name:      "scan-results",
		MountPath: "/home/securecodebox/",
	}}...)

	lurcherSidecar := &corev1.Container{
		Name:  "lurcher",
		Image: "scbexperimental/lurcher:latest",
		Args: []string{
			"--container",
			job.Spec.Template.Spec.Containers[0].Name,
			"--file",
			scanTemplate.Spec.ExtractResults.Location,
			"--url",
			resultUploadUrl.String(),
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
		ImagePullPolicy: "IfNotPresent",
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

	args := append(
		scanTemplate.Spec.JobTemplate.Spec.Template.Spec.Containers[0].Command,
		scan.Spec.Parameters...,
	)

	// Using args over commands
	job.Spec.Template.Spec.Containers[0].Args = args
	job.Spec.Template.Spec.Containers[0].Command = nil

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
func (r *ScanReconciler) startPersistenceProvider(scan *scansv1.Scan) error {
	ctx := context.Background()

	var persistenceProviders scansv1.PersistenceProviderList
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
						RestartPolicy: corev1.RestartPolicyNever,
						Containers: []corev1.Container{
							{
								Name:  "parser",
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

func (r *ScanReconciler) checkIfPersistingIsCompleted(scan *scansv1.Scan) error {
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

func (r *ScanReconciler) SetupWithManager(mgr ctrl.Manager) error {
	endpoint := os.Getenv("S3_ENDPOINT")
	accessKeyID := os.Getenv("S3_ACCESS_KEY")
	secretAccessKey := os.Getenv("S3_SECRET_KEY")
	useSSL := true

	// Initialize minio client object.
	minioClient, err := minio.New(endpoint, accessKeyID, secretAccessKey, useSSL)
	if err != nil {
		r.Log.Error(err, "Could not create minio client to communicate with s3 or compatible storage provider")
		panic(err)
	}
	r.MinioClient = *minioClient
	bucketName := os.Getenv("S3_BUCKET")

	bucketExists, err := r.MinioClient.BucketExists(bucketName)
	if err != nil || bucketExists == false {
		r.Log.Error(err, "Could not communicate with s3 or compatible storage provider")
		panic(err)
	}

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
		For(&scansv1.Scan{}).
		Owns(&batch.Job{}).
		Complete(r)
}
