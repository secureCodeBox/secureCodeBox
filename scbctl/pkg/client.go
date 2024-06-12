package client

import (
	"fmt"

	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

var (
	scheme = runtime.NewScheme()
)

type ClientProvider interface {
	GetClient(flags *genericclioptions.ConfigFlags) (client.Client, string, error)
}

type DefaultClientProvider struct{}

func (d *DefaultClientProvider) GetClient(flags *genericclioptions.ConfigFlags) (client.Client, string, error) {
	return GetClient(flags)
}

func init() {
	utilruntime.Must(v1.AddToScheme(scheme))
}

func GetClient(flags *genericclioptions.ConfigFlags) (client.Client, string, error) {
	cnfLoader := flags.ToRawKubeConfigLoader()

	cnf, err := cnfLoader.ClientConfig()
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate config from kubeconfig")
	}

	namespace, _, err := cnfLoader.Namespace()
	if err != nil {
		return nil, "", fmt.Errorf("failed to read namespace from kubeconfig")
	}

	utilruntime.Must(v1.AddToScheme(scheme))

	client, err := client.New(cnf, client.Options{Scheme: scheme})
	if err != nil {
		return nil, "", err
	}

	return client, namespace, nil
}
