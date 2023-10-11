// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package config

import (
	"os"

	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"
	"sigs.k8s.io/yaml"
)

type AutoDiscoveryConfig struct {
	Aws        AwsConfig        `json:"aws"`
	Kubernetes KubernetesConfig `json:"kubernetes"`
}

type AwsConfig struct {
	QueueUrl string `json:"queueUrl"`
	Region   string `json:"region"`
}

type KubernetesConfig struct {
	Namespace   string                `json:"namespace"`
	ScanConfigs []configv1.ScanConfig `json:"scanConfigs"`
}

func GetConfig(configFile string) AutoDiscoveryConfig {
	filecontent, err := os.ReadFile(configFile)
	if err != nil {
		panic("cannot open config file " + configFile)
	}

	var config AutoDiscoveryConfig
	err = yaml.Unmarshal(filecontent, &config)
	if err != nil {
		panic("cannot parse yaml from config file " + configFile)
	}

	return config
}
