/*
Copyright 2021.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package v1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	cfg "sigs.k8s.io/controller-runtime/pkg/config/v1alpha1"
)

//+kubebuilder:object:root=true
type AutoDiscoveryConfig struct {
	metav1.TypeMeta `json:",inline"`

	// ControllerManagerConfigurationSpec returns the contfigurations for controllers
	cfg.ControllerManagerConfigurationSpec `json:",inline"`

	Cluster                    ClusterConfig              `json:"cluster"`
	ResourceInclusion          ResourceInclusionConfig    `json:"resourceInclusion"`
	ServiceAutoDiscoveryConfig ServiceAutoDiscoveryConfig `json:"serviceAutoDiscovery"`
}

type ServiceAutoDiscoveryConfig struct {
	PassiveReconcileInterval metav1.Duration `json:"passiveReconcileInterval"`
	ScanConfig               ScanConfig      `json:"scanConfig"`
}

type ClusterConfig struct {
	Name string `json:"name"`
}

// HookState Describes the State of a Hook on a Scan
type ResourceInclusionMode string

const (
	EnabledPerNamespace ResourceInclusionMode = "enabled-per-namespace"
	EnabledPerResource  ResourceInclusionMode = "enabled-per-resource"
	All                 ResourceInclusionMode = "all"
)

type ResourceInclusionConfig struct {
	Mode ResourceInclusionMode `json:"mode"`
}

type ScanConfig struct {
	RepeatInterval metav1.Duration   `json:"repeatInterval"`
	Annotations    map[string]string `json:"annotations"`
	Labels         map[string]string `json:"labels"`
	ScanType       string            `json:"scanType"`
	Parameters     []string          `json:"parameters"`
}

func init() {
	SchemeBuilder.Register(&AutoDiscoveryConfig{})
}
