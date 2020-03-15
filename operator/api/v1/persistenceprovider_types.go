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
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// PersistenceProviderSpec defines the desired state of PersistenceProvider
type PersistenceProviderSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// Foo is an example field of PersistenceProvider. Edit PersistenceProvider_types.go to remove/update
	Image string          `json:"image,omitempty"`
	Env   []corev1.EnvVar `json:"env,omitempty"`
}

// PersistenceProviderStatus defines the observed state of PersistenceProvider
type PersistenceProviderStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
}

// +kubebuilder:object:root=true

// PersistenceProvider is the Schema for the persistenceproviders API
type PersistenceProvider struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   PersistenceProviderSpec   `json:"spec,omitempty"`
	Status PersistenceProviderStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// PersistenceProviderList contains a list of PersistenceProvider
type PersistenceProviderList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []PersistenceProvider `json:"items"`
}

func init() {
	SchemeBuilder.Register(&PersistenceProvider{}, &PersistenceProviderList{})
}
