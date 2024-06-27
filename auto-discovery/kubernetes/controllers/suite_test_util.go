// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"time"

	config "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/pkg/config"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var Config = config.AutoDiscoveryConfig{
	Cluster: config.ClusterConfig{
		Name: "test-cluster",
	},
	ServiceAutoDiscovery: config.ServiceAutoDiscoveryConfig{
		PassiveReconcileInterval: 1 * time.Second,
		ScanConfigs: []config.ScanConfig{
			{
				Name:           "test-scan-0",
				RepeatInterval: time.Hour,
				Annotations:    map[string]string{},
				Labels:         map[string]string{},
				Parameters:     []string{"-p", "{{ .Host.Port }}", "{{ .Service.Name }}.{{ .Service.Namespace }}.svc"},
				ScanType:       "nmap",
				HookSelector: metav1.LabelSelector{
					MatchLabels: map[string]string{
						"foo": "bar",
					},
				},
			},
			{
				Name:           "test-scan-1",
				RepeatInterval: time.Hour,
				Annotations:    map[string]string{},
				Labels:         map[string]string{},
				Parameters:     []string{"-p", "{{ .Host.Port }}", "{{ .Service.Name }}.{{ .Service.Namespace }}.svc"},
				ScanType:       "nmap",
				HookSelector: metav1.LabelSelector{
					MatchLabels: map[string]string{
						"foo": "bar",
					},
				},
			},
		},
	},
	ContainerAutoDiscovery: config.ContainerAutoDiscoveryConfig{
		PassiveReconcileInterval: 1 * time.Second,
		ScanConfigs: []config.ScanConfig{
			{
				Name:           "test-scan",
				RepeatInterval: time.Hour,
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
			},
			{
				Name:           "test-scan-two",
				RepeatInterval: time.Hour,
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
			},
		},
	},
	ResourceInclusion: config.ResourceInclusionConfig{
		Mode: config.EnabledPerResource,
	},
}

// broken config has two scans (per autodiscovery) defined with the same name which will trigger an error during controller setup
var BrokenConfig = config.AutoDiscoveryConfig{
	Cluster: config.ClusterConfig{
		Name: "test-cluster",
	},
	ServiceAutoDiscovery: config.ServiceAutoDiscoveryConfig{
		PassiveReconcileInterval: 1 * time.Second,
		ScanConfigs: []config.ScanConfig{
			{
				Name:           "test-scan",
				RepeatInterval: time.Hour,
				Annotations:    map[string]string{},
				Labels:         map[string]string{},
				Parameters:     []string{"-p", "{{ .Host.Port }}", "{{ .Service.Name }}.{{ .Service.Namespace }}.svc"},
				ScanType:       "nmap",
				HookSelector: metav1.LabelSelector{
					MatchLabels: map[string]string{
						"foo": "bar",
					},
				},
			},
			{
				Name:           "test-scan",
				RepeatInterval: time.Hour,
				Annotations:    map[string]string{},
				Labels:         map[string]string{},
				Parameters:     []string{"-p", "{{ .Host.Port }}", "{{ .Service.Name }}.{{ .Service.Namespace }}.svc"},
				ScanType:       "nmap",
				HookSelector: metav1.LabelSelector{
					MatchLabels: map[string]string{
						"foo": "bar",
					},
				},
			},
		},
	},
	ContainerAutoDiscovery: config.ContainerAutoDiscoveryConfig{
		PassiveReconcileInterval: 1 * time.Second,
		ScanConfigs: []config.ScanConfig{
			{
				Name:           "test-scan",
				RepeatInterval: time.Hour,
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
			},
			{
				Name:           "test-scan",
				RepeatInterval: time.Hour,
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
			},
		},
	},
	ResourceInclusion: config.ResourceInclusionConfig{
		Mode: config.EnabledPerResource,
	},
}
