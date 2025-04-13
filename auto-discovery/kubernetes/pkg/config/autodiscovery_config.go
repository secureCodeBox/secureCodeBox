// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package config

import (
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type AutoDiscoveryConfig struct {
	metav1.TypeMeta `json:",inline"`

	Metrics        MetricsConfig        `json:"metrics"`
	Health         HealthConfig         `json:"health"`
	LeaderElection LeaderElectionConfig `json:"leaderElection"`

	Cluster                ClusterConfig                `json:"cluster"`
	ResourceInclusion      ResourceInclusionConfig      `json:"resourceInclusion"`
	ServiceAutoDiscovery   ServiceAutoDiscoveryConfig   `json:"serviceAutoDiscovery"`
	ContainerAutoDiscovery ContainerAutoDiscoveryConfig `json:"containerAutoDiscovery"`
}

type MetricsConfig struct {
	BindAddress string `json:"bindAddress"`
}

type HealthConfig struct {
	HealthProbeBindAddress string `json:"healthProbeBindAddress"`
}

type LeaderElectionConfig struct {
	LeaderElect  bool   `json:"leaderElect"`
	ResourceName string `json:"resourceName"`
}

type ServiceAutoDiscoveryConfig struct {
	Enabled                  bool            `json:"enabled"`
	PassiveReconcileInterval metav1.Duration `json:"passiveReconcileInterval"`
	ScanConfigs              []ScanConfig    `json:"scanConfigs"`
}

type ContainerAutoDiscoveryConfig struct {
	Enabled                  bool                  `json:"enabled"`
	ImagePullSecretConfig    ImagePullSecretConfig `json:"imagePullSecretConfig"`
	PassiveReconcileInterval metav1.Duration       `json:"passiveReconcileInterval"`
	ScanConfigs              []ScanConfig          `json:"scanConfigs"`
}

type ImagePullSecretConfig struct {
	MapImagePullSecretsToEnvironmentVariables bool   `json:"mapImagePullSecretsToEnvironmentVariables"`
	UsernameEnvironmentVariableName           string `json:"usernameEnvironmentVariableName"`
	PasswordNameEnvironmentVariableName       string `json:"passwordEnvironmentVariableName"`
}

type ClusterConfig struct {
	Name string `json:"name"`
}

// ResourceInclusionMode Modes which can be used to trigger "ResourceInclusion" behavior which dictaes which resources are considered by the auto-discovery.
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
	Name           string               `json:"name"`
	RepeatInterval metav1.Duration      `json:"repeatInterval"`
	Annotations    map[string]string    `json:"annotations"`
	Labels         map[string]string    `json:"labels"`
	ScanType       string               `json:"scanType"`
	Parameters     []string             `json:"parameters"`
	Volumes        []corev1.Volume      `json:"volumes"`
	VolumeMounts   []corev1.VolumeMount `json:"volumeMounts"`
	HookSelector   metav1.LabelSelector `json:"hookSelector"`
	Env            []corev1.EnvVar      `json:"env,omitempty"`
}
