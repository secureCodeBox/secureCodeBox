// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package client

import (
	"flag"
	"fmt"
	"path/filepath"

	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

var (
	scheme = runtime.NewScheme()
)

type ClientProvider interface {
	GetClient(flags *genericclioptions.ConfigFlags) (*kubernetes.Clientset, *dynamic.DynamicClient, error)
}

type DefaultClientProvider struct{}

func (d *DefaultClientProvider) GetClient(flags *genericclioptions.ConfigFlags) (*kubernetes.Clientset, *dynamic.DynamicClient, error) {
	return GetClient(flags)
}

func init() {
	utilruntime.Must(v1.AddToScheme(scheme))
}

func GetClient(flags *genericclioptions.ConfigFlags) (*kubernetes.Clientset, *dynamic.DynamicClient, error) {
	var kubeconfig *string
	if home := homedir.HomeDir(); home != "" {
		kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "optional absolute path to the kubeconfig file")
	} else {
		kubeconfig = flag.String("kubeconfig", "", "absolute path to the kubeconfig file")
	}
	flag.Parse()
	config, err := clientcmd.BuildConfigFromFlags("", *kubeconfig)
	if err != nil {
		return nil, nil, fmt.Errorf("Error building kubeconfig: %s", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, nil, fmt.Errorf("Error creating kubernetes client: %s", err)
	}

	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, nil, fmt.Errorf("Error creating dynamic Client %s", err)
	}
	// cnfLoader := flags.ToRawKubeConfigLoader()

	// cnf, err := cnfLoader.ClientConfig()
	// if err != nil {
	// 	return nil, "", fmt.Errorf("failed to generate config from kubeconfig")
	// }

	// namespace, _, err := cnfLoader.Namespace()
	// if err != nil {
	// 	return nil, "", fmt.Errorf("failed to read namespace from kubeconfig")
	// }

	// utilruntime.Must(v1.AddToScheme(scheme))

	// client, err := client.New(cnf, client.Options{Scheme: scheme})
	// if err != nil {
	// 	return nil, "", err
	// }

	return clientset, dynamicClient, nil
}
