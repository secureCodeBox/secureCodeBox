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

// HookType Defines weather the hook should be able to change the findings or is run in a read only mode.
type HookType string

const (
	// ReadOnly ReadOnly Hooks are executed in parallel
	ReadOnly HookType = "ReadOnly"
	// ReadAndWrite ReadAndWrite Hooks are executed serially
	ReadAndWrite HookType = "ReadAndWrite"
)

// ScanCompletionHookSpec defines the desired state of ScanCompletionHook
type ScanCompletionHookSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// Image is the container image for the hooks kubernetes job
	Image            string                        `json:"image,omitempty"`
	ImagePullSecrets []corev1.LocalObjectReference `json:"imagePullSecrets,omitempty"`
	Env              []corev1.EnvVar               `json:"env,omitempty"`
	Type             HookType                      `json:"type"`
	// ServiceAccountName Name of the serviceAccount Name used. Should only be used if your hook needs specifc RBAC Access. Otherwise the hook is run using a "scan-completion-hook" service account. The service account should have at least "get" rights on scans.execution.securecodebox.io, and "get" & "patch" scans.execution.securecodebox.io/status
	ServiceAccountName *string `json:"serviceAccountName,omitempty"`
}

// ScanCompletionHookStatus defines the observed state of ScanCompletionHook
type ScanCompletionHookStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
}

// +kubebuilder:object:root=true
// +kubebuilder:printcolumn:name="Type",type=string,JSONPath=`.spec.type`,description="ScanCompletionHook Type"
// +kubebuilder:printcolumn:name="Image",type=string,JSONPath=`.spec.image`,description="ScanCompletionHook Image"

// ScanCompletionHook is the Schema for the ScanCompletionHooks API
type ScanCompletionHook struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ScanCompletionHookSpec   `json:"spec,omitempty"`
	Status ScanCompletionHookStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ScanCompletionHookList contains a list of ScanCompletionHook
type ScanCompletionHookList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ScanCompletionHook `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ScanCompletionHook{}, &ScanCompletionHookList{})
}
