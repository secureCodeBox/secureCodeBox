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
// +kubebuilder:printcolumn:name="Image",type=string,JSONPath=`.spec.jobTemplate.spec.template.spec.containers[0].image`,description="Scanner Container Image"

// ClusterScanType is the Schema for the ClusterScanTypes API
type ClusterScanType struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ScanTypeSpec   `json:"spec,omitempty"`
	Status ScanTypeStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ClusterScanTypeList contains a list of ClusterScanType
type ClusterScanTypeList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ClusterScanType `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ClusterScanType{}, &ClusterScanTypeList{})
}
