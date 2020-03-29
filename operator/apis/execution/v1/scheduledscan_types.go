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
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// ScheduledScanSpec defines the desired state of ScheduledScan
type ScheduledScanSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// Interval describes how often the scan should be repeated
	// Examples: '12h', '7d', '30m' (only days, hours and minutes supported, specified as integers)
	Interval metav1.Duration `json:"interval"`

	// HistoryLimit determines how many past Scans will be kept until the oldest one will be delted, defaults to 3. When set to 0 Scans will be deleted directly after completion
	HistoryLimit int64 `json:"historyLimit,omitempty"`

	// Foo is an example field of ScheduledScan. Edit ScheduledScan_types.go to remove/update
	ScanSpec *ScanSpec `json:"scanSpec"`
}

// ScheduledScanStatus defines the observed state of ScheduledScan
type ScheduledScanStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	LastScheduleTime *metav1.Time `json:"lastScheduleTime,omitempty"`

	// Findings Contains the findings stats of the most recent completed scan
	Findings FindingStats `json:"findings,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="UID",type=string,JSONPath=`.metadata.uid`,description="K8s Resource UID",priority=1
// +kubebuilder:printcolumn:name="Type",type=string,JSONPath=`.spec.scanSpec.scanType`,description="Scan Type"
// +kubebuilder:printcolumn:name="Findings",type=string,JSONPath=`.status.findings.count`,description="Total Finding Count"
// +kubebuilder:printcolumn:name="Parameters",type=string,JSONPath=`.spec.scanSpec.parameters`,description="Arguments passed to the Scanner",priority=1

// ScheduledScan is the Schema for the scheduledscans API
type ScheduledScan struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ScheduledScanSpec   `json:"spec,omitempty"`
	Status ScheduledScanStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ScheduledScanList contains a list of ScheduledScan
type ScheduledScanList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ScheduledScan `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ScheduledScan{}, &ScheduledScanList{})
}
