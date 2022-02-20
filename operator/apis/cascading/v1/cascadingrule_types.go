// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package v1

import (
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// CascadingRuleSpec defines the desired state of CascadingRule
type CascadingRuleSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// Matches defines to which findings the CascadingRule should apply
	Matches Matches `json:"matches"`

	// ScanLabels define additional labels for cascading scans
	// +optional
	ScanLabels map[string]string `json:"scanLabels"`

	// ScanAnnotations define additional annotations for cascading scans
	// +optional
	ScanAnnotations map[string]string `json:"scanAnnotations"`

	// ScanSpec defines how the cascaded scan should look like
	ScanSpec executionv1.ScanSpec `json:"scanSpec"`
}

// Matches defines how matching rules should be combined. Do all have to match? Or just One?
type Matches struct {
	AnyOf []MatchesRule `json:"anyOf,omitempty"`
}

// MatchesRule is a generic map which is used to model the structure of a finding for which the CascadingRule should take effect
type MatchesRule struct {
	Name        string                        `json:"name,omitempty"`
	Category    string                        `json:"category,omitempty"`
	Description string                        `json:"description,omitempty"`
	Location    string                        `json:"location,omitempty"`
	Severity    string                        `json:"severity,omitempty"`
	OsiLayer    string                        `json:"osi_layer,omitempty"`
	Attributes  map[string]intstr.IntOrString `json:"attributes,omitempty"`
}

// CascadingRuleStatus defines the observed state of CascadingRule
type CascadingRuleStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
}

// +kubebuilder:object:root=true
// +kubebuilder:printcolumn:name="Starts",type=string,JSONPath=`.spec.scanSpec.scanType`,description="Which Scanner is started when the CascadingRule applies"
// +kubebuilder:printcolumn:name="Invasiveness",type=string,JSONPath=`.metadata.labels.securecodebox\.io/invasive`,description="Indicates how invasive the Scanner is. Can be either 'invasive' or 'non-invasive'"
// +kubebuilder:printcolumn:name="Intensiveness",type=string,JSONPath=`.metadata.labels.securecodebox\.io/intensive`,description="Indicates how much ressource the Scanner consumes. Can be either 'light' or 'medium'"

// CascadingRule is the Schema for the cascadingrules API
type CascadingRule struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   CascadingRuleSpec   `json:"spec,omitempty"`
	Status CascadingRuleStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// CascadingRuleList contains a list of CascadingRule
type CascadingRuleList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []CascadingRule `json:"items"`
}

func init() {
	SchemeBuilder.Register(&CascadingRule{}, &CascadingRuleList{})
}
