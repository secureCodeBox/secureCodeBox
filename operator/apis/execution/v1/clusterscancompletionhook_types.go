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
// +kubebuilder:printcolumn:name="Type",type=string,JSONPath=`.spec.type`,description="ScanCompletionHook Type"
// +kubebuilder:printcolumn:name="Priority",type=string,JSONPath=`.spec.priority`,description="ScanCompletionHook Priority"
// +kubebuilder:printcolumn:name="Image",type=string,JSONPath=`.spec.image`,description="ScanCompletionHook Image"

// ClusterScanCompletionHook is the Schema for the ClusterScanCompletionHook API
type ClusterScanCompletionHook struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ScanCompletionHookSpec   `json:"spec,omitempty"`
	Status ScanCompletionHookStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ClusterScanCompletionHookList contains a list of ClusterScanCompletionHook
type ClusterScanCompletionHookList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ClusterScanCompletionHook `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ClusterScanCompletionHook{}, &ClusterScanCompletionHookList{})
}
