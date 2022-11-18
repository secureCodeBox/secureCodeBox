// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package v1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// +kubebuilder:object:root=true
// +kubebuilder:resource:scope=Cluster
// +kubebuilder:resource:singular=ClusterParseDefinition
// +kubebuilder:printcolumn:name="Image",type=string,JSONPath=`.spec.image`,description="Scanner Container Image"

// ClusterParseDefinition is the Schema for the clusterparsedefinitions API
type ClusterParseDefinition struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ParseDefinitionSpec   `json:"spec,omitempty"`
	Status ParseDefinitionStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ClusterParseDefinitionList contains a list of ClusterParseDefinition
type ClusterParseDefinitionList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ClusterParseDefinition `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ClusterParseDefinition{}, &ClusterParseDefinitionList{})
}
