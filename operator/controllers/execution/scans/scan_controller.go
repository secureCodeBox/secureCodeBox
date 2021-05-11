// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package scancontrollers

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/go-logr/logr"
	batch "k8s.io/api/batch/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
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
var s3StorageFinalizer = "s3.storage.securecodebox.io"

const defaultPresignDuration = 12 * time.Hour

// +kubebuilder:rbac:groups=execution.securecodebox.io,resources=scans,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=execution.securecodebox.io,resources=scans/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=execution.securecodebox.io,resources=scantypes,verbs=get;list;watch
// +kubebuilder:rbac:groups=execution.securecodebox.io,resources=parsedefinitions,verbs=get;list;watch
// +kubebuilder:rbac:groups=execution.securecodebox.io,resources=scancompletionhooks,verbs=get;list;watch
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

var errNotFound = "The specified key does not exist."

func (r *ScanReconciler) handleFinalizer(scan *executionv1.Scan) error {
	if containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizer) {
		bucketName := os.Getenv("S3_BUCKET")
		r.Log.V(0).Info("Deleting External Files from FileStorage", "ScanUID", scan.UID)
		err := r.MinioClient.RemoveObject(context.Background(), bucketName, fmt.Sprintf("scan-%s/%s", scan.UID, scan.Status.RawResultFile), minio.RemoveObjectOptions{})
		if err != nil && err.Error() != errNotFound {
			return err
		}
		err = r.MinioClient.RemoveObject(context.Background(), bucketName, fmt.Sprintf("scan-%s/findings.json", scan.UID), minio.RemoveObjectOptions{})

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

// PresignedGetURL returns a presigned URL from the s3 (or compatible) serice.
func (r *ScanReconciler) PresignedGetURL(scanID types.UID, filename string, duration time.Duration) (string, error) {
	bucketName := os.Getenv("S3_BUCKET")

	reqParams := make(url.Values)
	rawResultDownloadURL, err := r.MinioClient.PresignedGetObject(context.Background(), bucketName, fmt.Sprintf("scan-%s/%s", string(scanID), filename), duration, reqParams)
	if err != nil {
		r.Log.Error(err, "Could not get presigned url from s3 or compatible storage provider")
		return "", err
	}
	return rawResultDownloadURL.String(), nil
}

// PresignedPutURL returns a presigned URL from the s3 (or compatible) serice.
func (r *ScanReconciler) PresignedPutURL(scanID types.UID, filename string, duration time.Duration) (string, error) {
	bucketName := os.Getenv("S3_BUCKET")

	rawResultDownloadURL, err := r.MinioClient.PresignedPutObject(context.Background(), bucketName, fmt.Sprintf("scan-%s/%s", string(scanID), filename), duration)
	if err != nil {
		r.Log.Error(err, "Could not get presigned url from s3 or compatible storage provider")
		return "", err
	}
	return rawResultDownloadURL.String(), nil
}

func (r *ScanReconciler) initS3Connection() *minio.Client {
	endpoint := os.Getenv("S3_ENDPOINT")
	if os.Getenv("S3_PORT") != "" {
		endpoint = fmt.Sprintf("%s:%s", endpoint, os.Getenv("S3_PORT"))
	}
	// Only deactivate useSSL when explicitly set to false
	useSSL := true
	if os.Getenv("S3_USE_SSL") == "false" {
		useSSL = false
	}

	var creds *credentials.Credentials

	if authType, ok := os.LookupEnv("S3_AUTH_TYPE"); ok && strings.ToLower(authType) == "aws-irsa" {
		stsEndpoint := ""
		if configuredStsEndpoint, ok := os.LookupEnv("S3_AWS_IRSA_STS_ENDPOINT"); ok {
			stsEndpoint = configuredStsEndpoint
		}

		r.Log.Info("Using AWS IRSA ServiceAccount Bindung for S3 Authentication", "sts", stsEndpoint)
		creds = credentials.NewIAM(stsEndpoint)
	} else {
		creds = credentials.NewEnvMinio()
	}

	// Initialize minio client object.
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  creds,
		Secure: useSSL,
	})
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

func removeString(slice []string, s string) (result []string) {
	for _, item := range slice {
		if item == s {
			continue
		}
		result = append(result, item)
	}
	return
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
