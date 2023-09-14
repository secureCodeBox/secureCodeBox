// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package kubernetes

import (
	"context"
	"fmt"
	"strings"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type Request struct {
	Image       string
	ImageDigest string
}

func (r *Request) getImageName() string {
	return strings.Split(r.Image, ":")[0]
}

func (r *Request) getImageHash() string {
	split := strings.Split(r.ImageDigest, ":")
	return split[len(split)-1]
}

type AWSContainerScanReconciler struct {
	client.Client
	Namespace string
}

func (r *AWSContainerScanReconciler) Reconcile(ctx context.Context, req Request) error {
	fmt.Printf("Received reconcile request: %+v\n", req)
	scan := getScanForRequest(req)

	fmt.Println("Registering scan", scan.ObjectMeta.Name)
	res, err := r.CreateScan(ctx, scan)
	if err != nil {
		return err
	}

	fmt.Println("Successfully registered scan", res.ObjectMeta.Name)
	return nil
}

func AWSReconciler(namespace string) *AWSContainerScanReconciler {
	client, cfgNamespace, err := GetClient()
	if err != nil {
		panic(err)
	}
	if namespace != "" {
		cfgNamespace = namespace
	}

	return AWSReconcilerWith(client, cfgNamespace)
}

func AWSReconcilerWith(client client.Client, namespace string) *AWSContainerScanReconciler {
	return &AWSContainerScanReconciler{Client: client, Namespace: namespace}
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
