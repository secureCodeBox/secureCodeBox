// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package v1

import (
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// ParseDefinitionSpec defines the desired state of ParseDefinition
type ParseDefinitionSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	ScopeLimiterAliases map[string]string `json:"scopeLimiterAliases,omitempty"`

	// Image is the reference to the parser container image which ca transform the raw scan report into findings
	Image string `json:"image,omitempty"`
	// ImagePullSecrets used to access private parser images
	ImagePullSecrets []corev1.LocalObjectReference `json:"imagePullSecrets,omitempty"`
	// Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images
	ImagePullPolicy corev1.PullPolicy `json:"imagePullPolicy,omitempty"`

	// TTLSecondsAfterFinished configures the ttlSecondsAfterFinished field for the created parse job
	// +nullable
	TTLSecondsAfterFinished *int32 `json:"ttlSecondsAfterFinished,omitempty"`

	// Env allows to specify environment vars for the parser container.
	Env []corev1.EnvVar `json:"env,omitempty"`
	// Volumes allows to specify volumes for the parser container.
	Volumes []corev1.Volume `json:"volumes,omitempty"`
	// VolumeMounts allows to specify volume mounts for the parser container.
	VolumeMounts []corev1.VolumeMount `json:"volumeMounts,omitempty"`
}

// ParseDefinitionStatus defines the observed state of ParseDefinition
type ParseDefinitionStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
}

// +kubebuilder:object:root=true
// +kubebuilder:printcolumn:name="Image",type=string,JSONPath=`.spec.image`,description="Scanner Container Image"

// ParseDefinition is the Schema for the parsedefinitions API
type ParseDefinition struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ParseDefinitionSpec   `json:"spec,omitempty"`
	Status ParseDefinitionStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ParseDefinitionList contains a list of ParseDefinition
type ParseDefinitionList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ParseDefinition `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ParseDefinition{}, &ParseDefinitionList{})
}
