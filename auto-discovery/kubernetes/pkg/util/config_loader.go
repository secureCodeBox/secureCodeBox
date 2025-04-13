// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package util

import (
	"os"

	"sigs.k8s.io/yaml"

	config "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/pkg/config"
)

// LoadAutoDiscoveryConfig reads a YAML config file and unmarshals it into AutoDiscoveryConfig.
func LoadAutoDiscoveryConfig(filename string) (config.AutoDiscoveryConfig, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return config.AutoDiscoveryConfig{}, err
	}

	var cfg config.AutoDiscoveryConfig
	if err = yaml.Unmarshal(data, &cfg); err != nil {
		return config.AutoDiscoveryConfig{}, err
	}

	return cfg, nil
}
