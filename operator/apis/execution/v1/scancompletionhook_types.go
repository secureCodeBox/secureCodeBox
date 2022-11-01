// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

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

	// Defines weather the hook should be able to change the findings or is run in a read only mode.
	Type HookType `json:"type"`

	// Higher priority hooks run before low priority hooks. Within a priority class ReadAndWrite hooks are started before ReadOnly hooks, ReadAndWrite hooks wil be launched in serial, and ReadOnly hooks will be launched in parallel.
	// +kubebuilder:default=0
	// +kubebuilder:validation:Optional
	Priority int `json:"priority"`

	// Image is the container image for the hooks kubernetes job
	Image string `json:"image,omitempty"`
	// ImagePullSecrets used to access private hooks images
	ImagePullSecrets []corev1.LocalObjectReference `json:"imagePullSecrets,omitempty"`
	// Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images
	ImagePullPolicy corev1.PullPolicy `json:"imagePullPolicy,omitempty"`

	// Env allows to specify environment vars for the hooks container.
	Env []corev1.EnvVar `json:"env,omitempty"`
	// Volumes allows to specify volumes for the hooks container.
	Volumes []corev1.Volume `json:"volumes,omitempty"`
	// VolumeMounts allows to specify volume mounts for the hooks container.
	VolumeMounts []corev1.VolumeMount `json:"volumeMounts,omitempty"`
	// Affinity allows to specify a node affinity, to control on which nodes you want a hook to run. See: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/
	Affinity *corev1.Affinity `json:"affinity,omitempty"`
	// Tolerations are a different way to control on which nodes your hook is executed. See https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/
	Tolerations []corev1.Toleration `json:"tolerations,omitempty"`

	// ServiceAccountName Name of the serviceAccount Name used. Should only be used if your hook needs specifc RBAC Access. Otherwise the hook is run using a "scan-completion-hook" service account. The service account should have at least "get" rights on scans.execution.securecodebox.io, and "get" & "patch" scans.execution.securecodebox.io/status
	ServiceAccountName *string `json:"serviceAccountName,omitempty"`

	// TTLSecondsAfterFinished configures the ttlSecondsAfterFinished field for the created hook job
	// +nullable
	TTLSecondsAfterFinished *int32 `json:"ttlSecondsAfterFinished,omitempty"`

	// Resources lets you control resource limits and requests for the parser container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
	// +kubebuilder:default={requests:{cpu:"200m",memory:"100Mi"},limits:{cpu:"400m",memory:"200Mi"}}
	Resources corev1.ResourceRequirements `json:"resources,omitempty"`
}

// ScanCompletionHookStatus defines the observed state of ScanCompletionHook
type ScanCompletionHookStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
}

// +kubebuilder:object:root=true
// +kubebuilder:printcolumn:name="Type",type=string,JSONPath=`.spec.type`,description="ScanCompletionHook Type"
// +kubebuilder:printcolumn:name="Priority",type=string,JSONPath=`.spec.priority`,description="ScanCompletionHook Priority"
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
