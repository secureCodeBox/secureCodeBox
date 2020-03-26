/*


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

// TargetType defines the Type of the Target
// +kubebuilder:validation:Enum=Host;IPRange;Domain
type TargetType string

// TargetSpec defines the desired state of Target
type TargetSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file
	Type TargetType `json:"type,omitempty"`

	// Foo is an example field of Target. Edit Target_types.go to remove/update
	Address string `json:"address,omitempty"`
}

// TargetStatus defines the observed state of Target
type TargetStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
	State string `json:"state,omitempty"`

	LastScheduleTime *metav1.Time `json:"lastScheduleTime,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Type",type=string,JSONPath=`.spec.type`,description="Target Type"
// +kubebuilder:printcolumn:name="Address",type=string,JSONPath=`.spec.address`,description="Target Address"
// Target is the Schema for the targets API
type Target struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   TargetSpec   `json:"spec,omitempty"`
	Status TargetStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// TargetList contains a list of Target
type TargetList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Target `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Target{}, &TargetList{})
}
