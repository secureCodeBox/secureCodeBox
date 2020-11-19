/*
Copyright 2020 iteratec GmbH.

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
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// ParseDefinitionSpec defines the desired state of ParseDefinition
type ParseDefinitionSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// Image is the reference to the parser container image which ca transform the raw scan report into findings
	Image string `json:"image,omitempty"`
	// ImagePullSecrets used to access private parser images
	ImagePullSecrets []corev1.LocalObjectReference `json:"imagePullSecrets,omitempty"`
	// TTLSecondsAfterFinished configures the ttlSecondsAfterFinished field for the created parse job
	TTLSecondsAfterFinished *int32 `json:"ttlSecondsAfterFinished,omitempty"`
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
