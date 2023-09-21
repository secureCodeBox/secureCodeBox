// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package kubernetes

import (
	"context"
	"fmt"
	"strings"
	"time"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type Request struct {
	// The current state the container has in its lifecycle
	State string

	// Details about the running container instance
	Container ContainerInfo
}

type ContainerInfo struct {
	// A unique way to identify this container to make sure the state can be tracked properly
	Id string

	// Container image reference
	Image ImageInfo
}

type ImageInfo struct {
	Name   string
	Digest string
}

func (image *ImageInfo) getImageName() string {
	return strings.Split(image.Name, ":")[0]
}

func (image *ImageInfo) getImageHash() string {
	split := strings.Split(image.Digest, ":")
	return split[len(split)-1]
}

type AWSReconciler interface {
	Reconcile(ctx context.Context, req Request) error
}

type AWSContainerScanReconciler struct {
	client.Client
	Namespace string

	// "Set" of container IDs to track which containers are about to start so that very short lived
	// containers can be detected. Do not store the ImageInfo because containers might be pending
	// with or without a known digest and then the elements are not equal
	PendingContainers map[string]struct{}

	// Track which images are actually running and which instances use them
	// Technically a HashMap to a HashSet but Go doesn't have sets
	RunningContainers map[ImageInfo]map[string]struct{}
}

func (r *AWSContainerScanReconciler) Reconcile(ctx context.Context, req Request) error {
	fmt.Printf("Received reconcile request: %+v\n", req)

	// Decide what to do based on the current state we are notified about and the information we
	// saved about this container
	switch req.State {
	case "PENDING":
		// Add the unique identifier of this container to our "set"
		r.PendingContainers[req.Container.Id] = struct{}{}
		// If the container was running before, delete the ScheduledScan
		return r.HandleDeleteRequest(ctx, req)
	case "RUNNING":
		// Track this container and create a ScheduledScan for it
		return r.HandleCreateRequest(ctx, req)
	case "STOPPED":
		if _, ok := r.PendingContainers[req.Container.Id]; ok {
			// One off scan because container went from PENDING to STOPPED
			delete(r.PendingContainers, req.Container.Id)
			return r.HandleSingleScanRequest(ctx, req)
		} else {
			return r.HandleDeleteRequest(ctx, req)
		}
	default:
		return fmt.Errorf("unexpected container state: %s", req.State)
	}
}

func NewAWSReconciler(namespace string) *AWSContainerScanReconciler {
	client, cfgNamespace, err := GetClient()
	if err != nil {
		fmt.Println("Unable to create Kubernetes client", err)
		panic(err)
	}
	if namespace != "" {
		cfgNamespace = namespace
	}

	return NewAWSReconcilerWith(client, cfgNamespace)
}

func NewAWSReconcilerWith(client client.Client, namespace string) *AWSContainerScanReconciler {
	return &AWSContainerScanReconciler{
		Client:            client,
		Namespace:         namespace,
		PendingContainers: make(map[string]struct{}),
		RunningContainers: make(map[ImageInfo]map[string]struct{}),
	}
}

func (r *AWSContainerScanReconciler) HandleCreateRequest(ctx context.Context, req Request) error {
	// Remove from pending, ignores non-entries
	delete(r.PendingContainers, req.Container.Id)

	// Make sure there is at least an empty "set"
	if r.RunningContainers[req.Container.Image] == nil {
		r.RunningContainers[req.Container.Image] = make(map[string]struct{})
	}

	// Add this container to the "set" for this image
	r.RunningContainers[req.Container.Image][req.Container.Id] = struct{}{}

	// Create a scan in all cases
	scan := getScheduledScanForRequest(req)
	fmt.Println("Creating ScheduledScan", scan.ObjectMeta.Name)

	res, err := r.CreateScheduledScan(ctx, scan)
	if err != nil {
		// Avoid TOCTOU problems by checking the err instead of checking before if the scan exists
		if apierrors.IsAlreadyExists(err) {
			fmt.Println("ScheduledScan already exists, nothing to do")
			return nil
		}

		// What even is the AWS Monitor supposed to do with an error? Ignoring the message won't do
		// much anyway. Retry somehow?
		fmt.Println("Unexpected error while trying to create ScheduledScan", err)
		return err
	}

	fmt.Println("Successfully created ScheduledScan", res.ObjectMeta.Name)
	return nil
}

func (r *AWSContainerScanReconciler) HandleDeleteRequest(ctx context.Context, req Request) error {
	if r.RunningContainers[req.Container.Image] == nil {
		// We received a PENDING/STOPPED event but this container wasn't running before either
		fmt.Println("Container was not running before, nothing to do")
		return nil
	}

	delete(r.RunningContainers[req.Container.Image], req.Container.Id)
	if len(r.RunningContainers[req.Container.Image]) > 0 {
		// More containers using this image are running, keep the ScheduledScan
		fmt.Println("There are still instances of this image running, keeping the ScheduledScan")
		return nil
	}

	// Delete ScheduledScan since this was the last one
	name := getScanName(req, "aws-trivy-sbom")
	fmt.Println("Deleting ScheduledScan", name)

	err := r.DeleteScheduledScan(ctx, name)
	if err != nil {
		// If the scan was already gone ignore this, since we only wanted to delete it
		if apierrors.IsNotFound(err) {
			fmt.Println("ScheduledScan was already deleted, nothing to do")
			return nil
		}

		// Same problem here, how should the AWS Monitor even handle other errors?
		fmt.Println("Unexpected error while trying to delete ScheduledScan", err)
		return err
	}

	fmt.Println("Successfully deleted ScheduledScan", name)
	return nil
}

func (r *AWSContainerScanReconciler) HandleSingleScanRequest(ctx context.Context, req Request) error {
	scan := getScanForRequest(req)
	fmt.Println("Creating one-off Scan", scan.ObjectMeta.Name)

	_, err := r.CreateScan(ctx, scan)
	if err != nil {
		// Avoid TOCTOU problems by checking the err instead of checking before if the scan exists
		if apierrors.IsAlreadyExists(err) {
			fmt.Println("Scan already exists, nothing to do")
			return nil
		}

		// What even is the AWS Monitor supposed to do with an error? Ignoring the message won't do
		// much anyway. Retry somehow?
		fmt.Println("Unexpected error while trying to create scan", err)
		return err
	}

	return nil
}

func (r *AWSContainerScanReconciler) GetScan(ctx context.Context, name string) (*executionv1.Scan, error) {
	scan := &executionv1.Scan{}
	err := r.Client.Get(ctx, types.NamespacedName{Name: name, Namespace: r.Namespace}, scan)
	return scan, err
}

func (r *AWSContainerScanReconciler) ListScans(ctx context.Context) (*executionv1.ScanList, error) {
	var scans executionv1.ScanList
	err := r.Client.List(ctx, &scans, client.InNamespace(r.Namespace))
	return &scans, err
}

func (r *AWSContainerScanReconciler) CreateScan(ctx context.Context, scan *executionv1.Scan) (*executionv1.Scan, error) {
	scan.ObjectMeta.Namespace = r.Namespace
	err := r.Client.Create(ctx, scan)
	return scan, err
}

func (r *AWSContainerScanReconciler) DeleteScan(ctx context.Context, name string) error {
	scan := &executionv1.Scan{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: r.Namespace,
		},
	}

	return r.Client.Delete(ctx, scan)
}

func (r *AWSContainerScanReconciler) GetScheduledScan(ctx context.Context, name string) (*executionv1.ScheduledScan, error) {
	scheduledScan := &executionv1.ScheduledScan{}
	err := r.Client.Get(ctx, types.NamespacedName{Name: name, Namespace: r.Namespace}, scheduledScan)
	return scheduledScan, err
}

func (r *AWSContainerScanReconciler) ListScheduledScans(ctx context.Context) (*executionv1.ScheduledScanList, error) {
	var scheduledscans executionv1.ScheduledScanList
	err := r.Client.List(ctx, &scheduledscans, client.InNamespace(r.Namespace))
	return &scheduledscans, err
}

func (r *AWSContainerScanReconciler) CreateScheduledScan(ctx context.Context, scheduledScan *executionv1.ScheduledScan) (*executionv1.ScheduledScan, error) {
	scheduledScan.ObjectMeta.Namespace = r.Namespace
	err := r.Client.Create(ctx, scheduledScan)
	return scheduledScan, err
}

func (r *AWSContainerScanReconciler) DeleteScheduledScan(ctx context.Context, name string) error {
	scan := &executionv1.ScheduledScan{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: r.Namespace,
		},
	}

	return r.Client.Delete(ctx, scan)
}

func getScanForRequest(req Request) *executionv1.Scan {
	return &executionv1.Scan{
		ObjectMeta: metav1.ObjectMeta{
			Name: getScanName(req, "aws-trivy-sbom"),
		},
		Spec: executionv1.ScanSpec{
			ScanType:   "trivy-sbom-image",
			Parameters: []string{req.Container.Image.getImageName() + "@" + req.Container.Image.Digest},
		},
	}
}

func getScheduledScanForRequest(req Request) *executionv1.ScheduledScan {
	scan := executionv1.ScheduledScan{
		ObjectMeta: metav1.ObjectMeta{
			Name: getScanName(req, "aws-trivy-sbom"),
		},
		Spec: executionv1.ScheduledScanSpec{
			Interval: metav1.Duration{
				Duration: 12 * time.Hour,
			},
			ScanSpec: &executionv1.ScanSpec{
				ScanType:   "trivy-sbom-image",
				Parameters: []string{req.Container.Image.getImageName() + "@" + req.Container.Image.Digest},
			},
		},
	}

	return &scan
}

func getScanName(req Request, name string) string {
	// adapted from the kubernetes container autodiscovery
	// function builds string like: _appName_-_customScanName_-at-_imageID_HASH_ eg: nginx-myTrivyScan-at-0123456789

	appName := req.Container.Image.getImageName()
	hash := req.Container.Image.getImageHash()

	// TODO if image name contains a namespace the actual name will mostly get cut off
	// cutoff appname if it is longer than 20 chars
	maxAppLength := 20
	if len(appName) > maxAppLength {
		appName = appName[:maxAppLength]
	}

	result := fmt.Sprintf("%s-%s-at-%s", appName, name, hash)

	result = strings.ReplaceAll(result, ".", "-")
	result = strings.ReplaceAll(result, "/", "-")

	//limit scan name length to kubernetes limits
	return result[:62]
}

func GetClient() (client.Client, string, error) {
	fmt.Println("Connecting to Kubernetes cluster...")

	kubeconfigArgs := genericclioptions.NewConfigFlags(false)
	cnfLoader := kubeconfigArgs.ToRawKubeConfigLoader()
	cnf, err := cnfLoader.ClientConfig()
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate config from kubeconfig")
	}

	namespace, _, err := cnfLoader.Namespace()
	if err != nil {
		return nil, "", fmt.Errorf("failed to read namespace from kubeconfig")
	}

	scheme := runtime.NewScheme()
	utilruntime.Must(executionv1.AddToScheme(scheme))
	client, err := client.New(cnf, client.Options{Scheme: scheme})
	if err != nil {
		return nil, "", err
	}

	return client, namespace, nil
}
