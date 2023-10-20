// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package kubernetes

import (
	"context"
	"fmt"
	"strings"

	"github.com/go-logr/logr"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/pkg/config"
	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/pkg/util"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// A notification to the Reconciler, that a monitored cloud resource changed
type Request struct {
	// The current state the container has in its lifecycle
	State string

	// Details about the running container instance
	Container ContainerInfo
}

// Information about the monitored instance of a container
type ContainerInfo struct {
	// A unique way to identify this container to make sure the state can be tracked properly
	Id string

	// Container image reference
	Image ImageInfo
}

// Reconciler interface so that it can be mocked in tests
type CloudReconciler interface {
	Reconcile(ctx context.Context, req Request) error
}

// Kubernetes reconciler that updates ScheduledScans based on the Requests it receives
type CloudScanReconciler struct {
	client.Client
	Config *config.AutoDiscoveryConfig
	Log    logr.Logger

	// Track which images are actually running and which instances use them
	// Technically a HashMap to a HashSet but Go doesn't have sets
	// Containers are tracked per image because each image only needs one scan
	// To achieve this, RunningContainers maps the normalized image references to a "set" wich
	// contains the unique container instance IDs, scans are deleted when the last instance stops
	RunningContainers map[string]map[string]struct{}
}

// Values that can be referenced in templates when scans are created. Adapted from the kubernetes
// AutoDiscovery, but not all values offered there make sense here.
type ContainerAutoDiscoveryTemplateArgs struct {
	Config     config.AutoDiscoveryConfig
	ScanConfig configv1.ScanConfig
	Target     ContainerInfo
	ImageID    string
}

// Called with a Request if any monitored resource changed, updates kubernetes to match
func (r *CloudScanReconciler) Reconcile(ctx context.Context, req Request) error {
	r.Log.V(1).Info("Received reconcile request", "State", req.State, "Image", req.Container.Image.reference())

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

// Create a Reconciler with a new kubernetes connection
func NewReconciler(cfg *config.AutoDiscoveryConfig, log logr.Logger) *CloudScanReconciler {
	client, cfgNamespace, err := getClient(log)
	if err != nil {
		log.Error(err, "Unable to create Kubernetes client")
		panic(err)
	}
	if cfg.Kubernetes.Namespace == "" {
		cfg.Kubernetes.Namespace = cfgNamespace
	}

	return NewReconcilerWith(client, cfg, log)
}

// Create a Reconciler with a provided kubernetes client
func NewReconcilerWith(client client.Client, cfg *config.AutoDiscoveryConfig, log logr.Logger) *CloudScanReconciler {
	return &CloudScanReconciler{
		Client:            client,
		Config:            cfg,
		Log:               log,
		RunningContainers: make(map[string]map[string]struct{}),
	}
}

// Check requests for RUNNING containers and start scans if needed
func (r *CloudScanReconciler) handleCreateRequest(ctx context.Context, req Request) error {
	// Make sure there is at least an empty "set"
	if r.RunningContainers[req.Container.Image.reference()] == nil {
		r.RunningContainers[req.Container.Image.reference()] = make(map[string]struct{})
	}

	// Add this container instance to the "set" for this image
	r.RunningContainers[req.Container.Image.reference()][req.Container.Id] = struct{}{}

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

// Check requests for containers in other states but RUNNING and delete scans if needed
func (r *CloudScanReconciler) handleDeleteRequest(ctx context.Context, req Request) error {
	if r.RunningContainers[req.Container.Image.reference()] == nil {
		// We received a PENDING/STOPPED event but this container wasn't running before either
		r.Log.V(1).Info("Container was not running before, nothing to do")
		return nil
	}

	// Remove this instance from the Running set
	delete(r.RunningContainers[req.Container.Image.reference()], req.Container.Id)
	if len(r.RunningContainers[req.Container.Image.reference()]) > 0 {
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

func (r *CloudScanReconciler) createScheduledScan(ctx context.Context, scheduledScan *executionv1.ScheduledScan) (*executionv1.ScheduledScan, error) {
	scheduledScan.ObjectMeta.Namespace = r.Config.Kubernetes.Namespace
	err := r.Client.Create(ctx, scheduledScan)
	return scheduledScan, err
}

func (r *CloudScanReconciler) deleteScheduledScan(ctx context.Context, name string) error {
	scan := &executionv1.ScheduledScan{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: r.Config.Kubernetes.Namespace,
		},
	}

	return r.Client.Delete(ctx, scan)
}

// Generate a ScheduledScan based on the config and template values for a request the Reconciler received
func getScheduledScanForRequest(req Request, cfg *config.AutoDiscoveryConfig, scanConfig configv1.ScanConfig) *executionv1.ScheduledScan {
	templateArgs := ContainerAutoDiscoveryTemplateArgs{
		Config:     *cfg,
		ScanConfig: scanConfig,
		Target:     req.Container,
		ImageID:    req.Container.Image.reference(),
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

	appName := req.Container.Image.appName()
	hash := req.Container.Image.hash()

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

// Templating helper function taken from the kubernetes AutoDiscovery
func getScanAnnotations(scanConfig configv1.ScanConfig, templateArgs ContainerAutoDiscoveryTemplateArgs) map[string]string {
	return util.ParseMapTemplate(templateArgs, scanConfig.Annotations)
}

// Templating helper function taken from the kubernetes AutoDiscovery
func getScanLabels(scanConfig configv1.ScanConfig, templateArgs ContainerAutoDiscoveryTemplateArgs) map[string]string {
	generatedLabels := util.ParseMapTemplate(templateArgs, scanConfig.Labels)
	generatedLabels["app.kubernetes.io/managed-by"] = "securecodebox-autodiscovery"

	return generatedLabels
}

// Connect to kubernetes
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
