// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package kubernetes

import (
	"context"
	"fmt"
	"strings"

	"github.com/go-logr/logr"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/config"
	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/pkg/util"
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

func (image *ImageInfo) getReference() string {
	if image.Digest == "" {
		return image.Name
	} else {
		return image.Name + "@" + image.Digest
	}
}

type AWSReconciler interface {
	Reconcile(ctx context.Context, req Request) error
}

type AWSContainerScanReconciler struct {
	client.Client
	Config *config.AutoDiscoveryConfig
	Log    logr.Logger

	// Track which images are actually running and which instances use them
	// Technically a HashMap to a HashSet but Go doesn't have sets
	RunningContainers map[ImageInfo]map[string]struct{}
}

type ContainerAutoDiscoveryTemplateArgs struct {
	Config     config.AutoDiscoveryConfig
	ScanConfig configv1.ScanConfig
	Target     ContainerInfo
	ImageID    string
}

func (r *AWSContainerScanReconciler) Reconcile(ctx context.Context, req Request) error {
	r.Log.V(1).Info("Received reconcile request", "State", req.State, "Image", req.Container.Image.getReference())

	// Decide what to do based on the current state we are notified about and the information we
	// saved about this container
	switch req.State {
	case "RUNNING":
		// Track this container and create a ScheduledScan for it
		return r.handleCreateRequest(ctx, req)
	case "PENDING", "STOPPED":
		// This container is not running, check if the ScheduledScan needs to be deleted
		return r.handleDeleteRequest(ctx, req)
	default:
		return fmt.Errorf("unexpected container state: %s", req.State)
	}
}

func NewAWSReconciler(cfg *config.AutoDiscoveryConfig, log logr.Logger) *AWSContainerScanReconciler {
	client, cfgNamespace, err := getClient(log)
	if err != nil {
		log.Error(err, "Unable to create Kubernetes client")
		panic(err)
	}
	if cfg.Kubernetes.Namespace == "" {
		cfg.Kubernetes.Namespace = cfgNamespace
	}

	return NewAWSReconcilerWith(client, cfg, log)
}

func NewAWSReconcilerWith(client client.Client, cfg *config.AutoDiscoveryConfig, log logr.Logger) *AWSContainerScanReconciler {
	return &AWSContainerScanReconciler{
		Client:            client,
		Config:            cfg,
		Log:               log,
		RunningContainers: make(map[ImageInfo]map[string]struct{}),
	}
}

func (r *AWSContainerScanReconciler) handleCreateRequest(ctx context.Context, req Request) error {
	// Make sure there is at least an empty "set"
	if r.RunningContainers[req.Container.Image] == nil {
		r.RunningContainers[req.Container.Image] = make(map[string]struct{})
	}

	// Add this container to the "set" for this image
	r.RunningContainers[req.Container.Image][req.Container.Id] = struct{}{}

	// Create all configured scans
	var err error = nil
	for _, scanConfig := range r.Config.Kubernetes.ScanConfigs {
		scan := getScheduledScanForRequest(req, r.Config, scanConfig)
		r.Log.V(1).Info("Creating ScheduledScan", "Name", scan.ObjectMeta.Name)

		// Always try to create the scan and later check if it might have existed already
		res, thiserr := r.createScheduledScan(ctx, scan)
		if thiserr != nil {
			// Avoid TOCTOU problems by checking the err instead of checking before if the scan exists
			if apierrors.IsAlreadyExists(thiserr) {
				r.Log.V(1).Info("ScheduledScan already exists, nothing to do")
			} else {
				// What even is the AWS Monitor supposed to do with an error? Ignoring the message won't do
				// much anyway. Retry somehow?
				r.Log.Error(err, "Unexpected error while trying to create ScheduledScan")
				err = thiserr
			}
		} else {
			r.Log.Info("Successfully created ScheduledScan", "Name", res.ObjectMeta.Name)
		}
	}
	return err
}

func (r *AWSContainerScanReconciler) handleDeleteRequest(ctx context.Context, req Request) error {
	if r.RunningContainers[req.Container.Image] == nil {
		// We received a PENDING/STOPPED event but this container wasn't running before either
		r.Log.V(1).Info("Container was not running before, nothing to do")
		return nil
	}

	delete(r.RunningContainers[req.Container.Image], req.Container.Id)
	if len(r.RunningContainers[req.Container.Image]) > 0 {
		// More containers using this image are running, keep the ScheduledScan
		r.Log.V(1).Info("There are still instances of this image running, keeping the ScheduledScan")
		return nil
	}

	// Delete all ScheduledScans since this was the last one
	var err error = nil
	for _, scanConfig := range r.Config.Kubernetes.ScanConfigs {
		name := getScanName(req, scanConfig.Name)
		r.Log.V(1).Info("Deleting ScheduledScan", "Name", name)

		thiserr := r.deleteScheduledScan(ctx, name)
		if thiserr != nil {
			// If the scan was already gone ignore this, since we only wanted to delete it
			if apierrors.IsNotFound(thiserr) {
				r.Log.V(1).Info("ScheduledScan was already deleted, nothing to do")
			} else {
				// Same problem here, how should the AWS Monitor even handle other errors?
				r.Log.Error(thiserr, "Unexpected error while trying to delete ScheduledScan")
				err = thiserr
			}
		} else {
			r.Log.Info("Successfully deleted ScheduledScan", "Name", name)
		}
	}
	return err
}

func (r *AWSContainerScanReconciler) getScheduledScan(ctx context.Context, name string) (*executionv1.ScheduledScan, error) {
	scheduledScan := &executionv1.ScheduledScan{}
	err := r.Client.Get(ctx, types.NamespacedName{Name: name, Namespace: r.Config.Kubernetes.Namespace}, scheduledScan)
	return scheduledScan, err
}

func (r *AWSContainerScanReconciler) listScheduledScans(ctx context.Context) (*executionv1.ScheduledScanList, error) {
	var scheduledscans executionv1.ScheduledScanList
	err := r.Client.List(ctx, &scheduledscans, client.InNamespace(r.Config.Kubernetes.Namespace))
	return &scheduledscans, err
}

func (r *AWSContainerScanReconciler) createScheduledScan(ctx context.Context, scheduledScan *executionv1.ScheduledScan) (*executionv1.ScheduledScan, error) {
	scheduledScan.ObjectMeta.Namespace = r.Config.Kubernetes.Namespace
	err := r.Client.Create(ctx, scheduledScan)
	return scheduledScan, err
}

func (r *AWSContainerScanReconciler) deleteScheduledScan(ctx context.Context, name string) error {
	scan := &executionv1.ScheduledScan{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: r.Config.Kubernetes.Namespace,
		},
	}

	return r.Client.Delete(ctx, scan)
}

func getScheduledScanForRequest(req Request, cfg *config.AutoDiscoveryConfig, scanConfig configv1.ScanConfig) *executionv1.ScheduledScan {
	templateArgs := ContainerAutoDiscoveryTemplateArgs{
		Config:     *cfg,
		ScanConfig: scanConfig,
		Target:     req.Container,
		ImageID:    req.Container.Image.getReference(),
	}
	scanSpec := util.GenerateScanSpec(scanConfig, templateArgs)

	newScheduledScan := executionv1.ScheduledScan{
		ObjectMeta: metav1.ObjectMeta{
			Name:        getScanName(req, scanConfig.Name),
			Namespace:   cfg.Kubernetes.Namespace,
			Annotations: getScanAnnotations(scanConfig, templateArgs),
			Labels:      getScanLabels(scanConfig, templateArgs),
		},
		Spec: scanSpec,
	}
	return &newScheduledScan
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

	// limit scan name length to kubernetes limits
	if len(result) > 62 {
		result = result[:62]
	}

	return result
}

func getScanAnnotations(scanConfig configv1.ScanConfig, templateArgs ContainerAutoDiscoveryTemplateArgs) map[string]string {
	return util.ParseMapTemplate(templateArgs, scanConfig.Annotations)
}

func getScanLabels(scanConfig configv1.ScanConfig, templateArgs ContainerAutoDiscoveryTemplateArgs) map[string]string {
	generatedLabels := util.ParseMapTemplate(templateArgs, scanConfig.Labels)
	generatedLabels["app.kubernetes.io/managed-by"] = "securecodebox-autodiscovery"

	return generatedLabels
}

func getClient(log logr.Logger) (client.Client, string, error) {
	log.Info("Connecting to Kubernetes cluster...")

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
