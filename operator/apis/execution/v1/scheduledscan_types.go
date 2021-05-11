// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

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
	// Examples: '12h', '30m'
	Interval metav1.Duration `json:"interval"`

	// SuccessfulJobsHistoryLimit determines how many past Scans will be kept until the oldest one will be deleted, defaults to 3. When set to 0, Scans will be deleted directly after completion
	// +kubebuilder:validation:Optional
	// +kubebuilder:validation:Minimum=0
	SuccessfulJobsHistoryLimit *int32 `json:"successfulJobsHistoryLimit,omitempty"`
	// FailedJobsHistoryLimit determines how many failed past Scans will be kept until the oldest one will be deleted, defaults to 3. When set to 0, Scans will be deleted directly after failure
	// +kubebuilder:validation:Optional
	// +kubebuilder:validation:Minimum=0
	FailedJobsHistoryLimit *int32 `json:"failedJobsHistoryLimit,omitempty"`

	// ScanSpec describes the scan which should be started regularly
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
// +kubebuilder:printcolumn:name="Interval",type=string,JSONPath=`.spec.interval`,description="Interval"
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
