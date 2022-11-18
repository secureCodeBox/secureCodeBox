// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package v1

import (
	batchv1 "k8s.io/api/batch/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// ScanTypeSpec defines the desired state of ScanType
type ScanTypeSpec struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	ExtractResults ExtractResults `json:"extractResults,omitempty"`

	// Template of the kubernetes job to create when running the scan
	JobTemplate batchv1.Job `json:"jobTemplate,omitempty"`
}

// ExtractResults configures where the secureCodeBox can find the results of the scan once the scanner container exited.
type ExtractResults struct {
	// Indicates the type of the file. Usually a combination of the scanner name and file type. E.g. `nmap-xml`
	Type string `json:"type,omitempty"`

	// From where to extract the file? Absolute path on the containers file system. Must be located in `/home/securecodebox/`. E.g. `/home/securecodebox/nmap-results.xml`
	Location string `json:"location,omitempty"`
}

// ScanTypeStatus defines the observed state of ScanType
type ScanTypeStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
}

// +kubebuilder:object:root=true
// +kubebuilder:resource:singular=ScanType
// +kubebuilder:printcolumn:name="Image",type=string,JSONPath=`.spec.jobTemplate.spec.template.spec.containers[0].image`,description="Scanner Container Image"

// ScanType is the Schema for the scantypes API
type ScanType struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ScanTypeSpec   `json:"spec,omitempty"`
	Status ScanTypeStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ScanTypeList contains a list of ScanType
type ScanTypeList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ScanType `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ScanType{}, &ScanTypeList{})
}
