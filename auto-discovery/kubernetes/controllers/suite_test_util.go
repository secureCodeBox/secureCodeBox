// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"time"

	config "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/pkg/config"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// newServiceScanConfigMock creates a mock scan configuration specifically for service auto-discovery
func newServiceScanConfigMock(name string) config.ScanConfig {
	return config.ScanConfig{
		Name:           name,
		RepeatInterval: metav1.Duration{Duration: time.Hour},
		Annotations:    map[string]string{},
		Labels:         map[string]string{},
		Parameters:     []string{"-p", "{{ .Host.Port }}", "{{ .Service.Name }}.{{ .Service.Namespace }}.svc"},
		ScanType:       "nmap",
		HookSelector: metav1.LabelSelector{
			MatchLabels: map[string]string{
				"foo": "bar",
			},
		},
	}
}

// newContainerScanConfigMock creates a mock scan configuration specifically for container auto-discovery
func newContainerScanConfigMock(name string) config.ScanConfig {
	return config.ScanConfig{
		Name:           name,
		RepeatInterval: metav1.Duration{Duration: time.Hour},
		Annotations:    map[string]string{"testAnnotation": "{{ .Namespace.Name }}"},
		Labels:         map[string]string{"testLabel": "{{ .Namespace.Name }}"},
		Parameters:     []string{"-p", "{{ .Namespace.Name }}"},
		ScanType:       "nmap",
		HookSelector: metav1.LabelSelector{
			MatchExpressions: []metav1.LabelSelectorRequirement{
				{
					Operator: metav1.LabelSelectorOpIn,
					Key:      "foo",
					Values:   []string{"bar", "baz"},
				},
				{
					Operator: metav1.LabelSelectorOpDoesNotExist,
					Key:      "foo",
				},
			},
		},
	}
}

// AutoDiscoveryConfigMock holds the complete mock configuration
var AutoDiscoveryConfigMock = config.AutoDiscoveryConfig{
	Cluster: config.ClusterConfig{
		Name: "test-cluster",
	},
	ServiceAutoDiscovery: config.ServiceAutoDiscoveryConfig{
		PassiveReconcileInterval: metav1.Duration{Duration: 1 * time.Second},
		ScanConfigs: []config.ScanConfig{
			newServiceScanConfigMock("test-scan-0"),
			newServiceScanConfigMock("test-scan-1"),
		},
	},
	ContainerAutoDiscovery: config.ContainerAutoDiscoveryConfig{
		PassiveReconcileInterval: metav1.Duration{Duration: 1 * time.Second},
		ImagePullSecretConfig: config.ImagePullSecretConfig{
			MapImagePullSecretsToEnvironmentVariables: true,
			UsernameEnvironmentVariableName:           "username",
			PasswordNameEnvironmentVariableName:       "password",
		},
		ScanConfigs: []config.ScanConfig{
			newContainerScanConfigMock("test-scan"),
			newContainerScanConfigMock("test-scan-two"),
		},
	},
	ResourceInclusion: config.ResourceInclusionConfig{
		Mode: config.EnabledPerResource,
	},
}
