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
	batchv1 "k8s.io/api/batch/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// ScanTemplateSpec defines the desired state of ScanTemplate
type ScanTemplateSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	ExtractResults ExtractResults `json:"extractResults,omitempty"`

	// Template of the kubernetes job to create when running the scan
	JobTemplate batchv1.Job `json:"jobTemplate,omitempty"`
}

// ExtractResults configures where the secureCodeBox can find the results of the scan once the scanner container exited.
type ExtractResults struct {
	// Indicates the type of the file. Usaually a comibination of the scanner name and file type. E.g. `nmap-xml`
	Type string `json:"type,omitempty"`

	// From where to extract the file? Absolute path on the containers file system. Must be located in `/home/securecodebox/`. E.g. `/home/securecodebox/nmap-results.xml`
	Location string `json:"location,omitempty"`
}

// ScanTemplateStatus defines the observed state of ScanTemplate
type ScanTemplateStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file
}

// +kubebuilder:object:root=true

// ScanTemplate is the Schema for the scantemplates API
// +kubebuilder:printcolumn:name="Image",type=string,JSONPath=`.spec.jobTemplate.spec.template.spec.containers[0].image`,description="The container image for the scan job"
type ScanTemplate struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ScanTemplateSpec   `json:"spec,omitempty"`
	Status ScanTemplateStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ScanTemplateList contains a list of ScanTemplate
type ScanTemplateList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []ScanTemplate `json:"items"`
}

func init() {
	SchemeBuilder.Register(&ScanTemplate{}, &ScanTemplateList{})
}
