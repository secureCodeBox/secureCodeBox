// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package config

import (
	"os"

	autoDiscoveryConfig "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/pkg/config"
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
	Namespace   string                           `json:"namespace"`
	ScanConfigs []autoDiscoveryConfig.ScanConfig `json:"scanConfigs"`
}

// Re-export ScanConfig for convenience
type ScanConfig = autoDiscoveryConfig.ScanConfig

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
