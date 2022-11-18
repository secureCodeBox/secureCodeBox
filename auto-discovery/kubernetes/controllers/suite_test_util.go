package controllers

import (
	"time"

	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var Config = configv1.AutoDiscoveryConfig{
	Cluster: configv1.ClusterConfig{
		Name: "test-cluster",
	},
	ServiceAutoDiscoveryConfig: configv1.ServiceAutoDiscoveryConfig{
		PassiveReconcileInterval: metav1.Duration{Duration: 1 * time.Second},
		ScanConfigs: []configv1.ScanConfig{
			{
				Name:           "test-scan",
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
			},
		},
	},
	ContainerAutoDiscoveryConfig: configv1.ContainerAutoDiscoveryConfig{
		PassiveReconcileInterval: metav1.Duration{Duration: 1 * time.Second},
		ScanConfigs: []configv1.ScanConfig{
			{
				Name:           "test-scan",
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
			},
		},
	},
	ResourceInclusion: configv1.ResourceInclusionConfig{
		Mode: configv1.EnabledPerResource,
	},
}

// broken config has two scans (per autodiscovery) defined with the same name which will trigger an error during controller setup
var BrokenConfig = configv1.AutoDiscoveryConfig{
	Cluster: configv1.ClusterConfig{
		Name: "test-cluster",
	},
	ServiceAutoDiscoveryConfig: configv1.ServiceAutoDiscoveryConfig{
		PassiveReconcileInterval: metav1.Duration{Duration: 1 * time.Second},
		ScanConfigs: []configv1.ScanConfig{
			{
				Name:           "test-scan",
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
			},
			{
				Name:           "test-scan",
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
			},
		},
	},
	ContainerAutoDiscoveryConfig: configv1.ContainerAutoDiscoveryConfig{
		PassiveReconcileInterval: metav1.Duration{Duration: 1 * time.Second},
		ScanConfigs: []configv1.ScanConfig{
			{
				Name:           "test-scan",
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
			},
			{
				Name:           "test-scan",
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
			},
		},
	},
	ResourceInclusion: configv1.ResourceInclusionConfig{
		Mode: configv1.EnabledPerResource,
	},
}
