// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package client

import (
	"fmt"

	cascadingv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/cascading/v1"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	v1 "k8s.io/api/apps/v1"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

var (
	scheme = runtime.NewScheme()
)

func init() {
	utilruntime.Must(corev1.AddToScheme(scheme))
	utilruntime.Must(batchv1.AddToScheme(scheme))
	utilruntime.Must(executionv1.AddToScheme(scheme))
	utilruntime.Must(cascadingv1.AddToScheme(scheme))
}

type ClientProvider interface {
	GetClient(flags *genericclioptions.ConfigFlags) (client.Client, string, error)
}

type DefaultClientProvider struct{}

func (d *DefaultClientProvider) GetClient(flags *genericclioptions.ConfigFlags) (client.Client, string, error) {
	return GetClient(flags)
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
