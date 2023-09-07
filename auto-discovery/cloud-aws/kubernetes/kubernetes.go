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
	"k8s.io/apimachinery/pkg/runtime/serializer"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	cfg "sigs.k8s.io/controller-runtime/pkg/client/config"
)

func init() {
	executionv1.AddToScheme(scheme.Scheme)
}

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
	Client    *rest.RESTClient
	Namespace string
}

func (r *AWSContainerScanReconciler) Reconcile(ctx context.Context, req Request) error {
	fmt.Printf("Received reconcile request: %+v\n", req)
	scan := getScanForRequest(req)

	fmt.Println("Registering scan", scan.ObjectMeta.Name)
	res, err := r.RegisterScan(ctx, scan)
	if err != nil {
		return err
	}

	fmt.Println("Successfully registered scan", res.ObjectMeta.Name)
	return nil
}

func AWSReconciler(namespace string) *AWSContainerScanReconciler {
	config := getConfig()
	client := getClient(config)

	return AWSReconcilerWith(client, namespace)
}

func AWSReconcilerWith(client *rest.RESTClient, namespace string) *AWSContainerScanReconciler {
	return &AWSContainerScanReconciler{Client: client, Namespace: namespace}
}

func (r *AWSContainerScanReconciler) GetScans(ctx context.Context) (*executionv1.ScanList, error) {
	var scans executionv1.ScanList
	err := r.Client.Get().
		Namespace(r.Namespace).
		Resource("scans").
		Do(ctx).
		Into(&scans)
	return &scans, err
}

func (r *AWSContainerScanReconciler) RegisterScan(ctx context.Context, scan *executionv1.Scan) (*executionv1.Scan, error) {
	var newScan executionv1.Scan
	err := r.Client.Post().
		Namespace(r.Namespace).
		Resource("scans").
		Body(scan).
		Do(ctx).
		Into(&newScan)
	return &newScan, err
}

func (r *AWSContainerScanReconciler) GetScheduledScans(ctx context.Context) (*executionv1.ScheduledScanList, error) {
	var scheduledscans executionv1.ScheduledScanList
	err := r.Client.Get().
		Namespace(r.Namespace).
		Resource("scheduledscans").
		Do(ctx).
		Into(&scheduledscans)
	return &scheduledscans, err
}

func (r *AWSContainerScanReconciler) RegisterScheduledScan(ctx context.Context, scheduledscan *executionv1.ScheduledScan) (*executionv1.ScheduledScan, error) {
	var newScheduledScan executionv1.ScheduledScan
	err := r.Client.Post().
		Namespace(r.Namespace).
		Resource("scheduledscans").
		Body(scheduledscan).
		Do(ctx).
		Into(&newScheduledScan)
	return &newScheduledScan, err
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

func getClient(config *rest.Config) *rest.RESTClient {
	client, err := rest.RESTClientFor(getConfig())
	if err != nil {
		panic(err)
	}

	return client
}

func getConfig() *rest.Config {
	config := cfg.GetConfigOrDie()
	config.ContentConfig.GroupVersion = &executionv1.GroupVersion
	config.APIPath = "/apis"
	config.NegotiatedSerializer = serializer.NewCodecFactory(scheme.Scheme)
	config.UserAgent = rest.DefaultKubernetesUserAgent()

	return config
}
