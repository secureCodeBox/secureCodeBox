// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package kubernetes

import (
	"context"
	"fmt"
	"strings"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type ContainerInfo struct {
	Image       string
	ImageDigest string
}

type Request struct {
	Action string
	ContainerInfo
}

func (r *Request) getImageName() string {
	return strings.Split(r.Image, ":")[0]
}

func (r *Request) getImageHash() string {
	split := strings.Split(r.ImageDigest, ":")
	return split[len(split)-1]
}

type AWSReconciler interface {
	Reconcile(ctx context.Context, req Request) error
}

type AWSContainerScanReconciler struct {
	client.Client
	Namespace       string
	ContainerCounts map[ContainerInfo]uint
}

func (r *AWSContainerScanReconciler) Reconcile(ctx context.Context, req Request) error {
	fmt.Printf("Received reconcile request: %+v\n", req)

	// TODO when an event comes in that a container has started there needs to be a way to recognize
	// if that is a new container using the same image, or a container sen before as they will be
	// included in the requests/events as well => IDs? AWS ARNs would work
	// TODO very shortlived containers never show the status RUNNING
	// Possible solution: for each container track the last seen status, count a state change from
	// PENDING to either RUNNING or STOPPED as a run
	switch req.Action {
	case "added":
		scan := getScanForRequest(req)
		fmt.Println("Creating scan", scan.ObjectMeta.Name)

		// Update stored count for this container
		r.ContainerCounts[req.ContainerInfo]++

		res, err := r.CreateScan(ctx, scan)
		if err != nil {
			// Avoid TOCTOU problems by checking the err instead of checking if the scan exists
			// ahead of time
			if apierrors.IsAlreadyExists(err) {
				fmt.Println("Scan already exists, nothing to do")
				return nil
			}

			// What even is the AWS Monitor supposed to do with an error? Ignoring the message won't
			// do much anyway. Retry somehow?
			fmt.Println("Unexpected error while trying to create scan", err)
			return err
		}

		fmt.Println("Successfully created scan", res.ObjectMeta.Name)
	case "removed":
		name := getScanName(req, "aws-trivy-sbom")
		fmt.Println("Deleting scan", name)

		if r.ContainerCounts[req.ContainerInfo] > 1 {
			// There are still multiple instances of this container running, only decrement count
			r.ContainerCounts[req.ContainerInfo]--
			return nil
		} else if r.ContainerCounts[req.ContainerInfo] == 1 {
			// If exactly one container instance is left reset to 0 and delete the scan
			// Otherwise ignore the count to prevent underflow
			r.ContainerCounts[req.ContainerInfo] = 0
		}

		err := r.DeleteScan(ctx, name)
		if err != nil {
			// If the scan was already gone ignore this, since we only wanted to delete it
			if apierrors.IsNotFound(err) {
				fmt.Println("Scan was already deleted, nothing to do")
				return nil
			}

			// Same problem here, how should the AWS Monitor even handle other errors?
			fmt.Println("Unexpected error while trying to delete scan", err)
			return err
		}

		fmt.Println("Successfully deleted scan", name)
	default:
		// Need this default case because strings are a poor excuse for sum types
		panic("invalid action for request: " + req.Action)
	}

	return nil
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
		Client:          client,
		Namespace:       namespace,
		ContainerCounts: make(map[ContainerInfo]uint),
	}
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
	scan := executionv1.Scan{
		ObjectMeta: metav1.ObjectMeta{
			Name: getScanName(req, "aws-trivy-sbom"),
		},
		Spec: executionv1.ScanSpec{
			ScanType:   "trivy-sbom-image",
			Parameters: []string{req.getImageName() + "@" + req.ImageDigest},
		},
	}

	return &scan
}

func getScanName(req Request, name string) string {
	// adapted from the kubernetes container autodiscovery
	// function builds string like: _appName_-_customScanName_-at-_imageID_HASH_ eg: nginx-myTrivyScan-at-0123456789

	appName := req.getImageName()
	hash := req.getImageHash()

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
