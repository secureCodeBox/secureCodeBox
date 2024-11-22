// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package scancontrollers

import (
	"fmt"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var _ = Describe("generateJobForHook", func() {
	var (
		hookName           string
		hookSpec           *executionv1.ScanCompletionHookSpec
		scan               *executionv1.Scan
		cliArgs            []string
		serviceAccountName string
	)

	BeforeEach(func() {
		hookName = "test-hook"
		hookSpec = &executionv1.ScanCompletionHookSpec{
			Image: "test-image:latest",
			Type:  executionv1.ReadAndWrite,
		}
		scan = &executionv1.Scan{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "test-scan",
				Namespace: "default",
			},
		}
		cliArgs = []string{"arg1", "arg2"}
		serviceAccountName = "test-sa"
	})

	It("should generate a job with correct basic properties", func() {
		job := generateJobForHook(hookName, hookSpec, scan, cliArgs, serviceAccountName)

		Expect(job.ObjectMeta.GenerateName).To(HavePrefix(fmt.Sprintf("%s-%s", hookName, scan.Name)))
		Expect(job.ObjectMeta.Namespace).To(Equal(scan.Namespace))
		Expect(job.Spec.Template.Spec.ServiceAccountName).To(Equal(serviceAccountName))
		Expect(job.Spec.Template.Spec.Containers[0].Image).To(Equal(hookSpec.Image))
		Expect(job.Spec.Template.Spec.Containers[0].Args).To(Equal(cliArgs))
	})

	It("should set correct labels based on hook type", func() {
		job := generateJobForHook(hookName, hookSpec, scan, cliArgs, serviceAccountName)

		Expect(job.ObjectMeta.Labels["securecodebox.io/job-type"]).To(Equal("read-and-write-hook"))
		Expect(job.ObjectMeta.Labels["securecodebox.io/hook-name"]).To(Equal(hookName))

		hookSpec.Type = executionv1.ReadOnly
		job = generateJobForHook(hookName, hookSpec, scan, cliArgs, serviceAccountName)

		Expect(job.ObjectMeta.Labels["securecodebox.io/job-type"]).To(Equal("read-only-hook"))
	})

	It("should set default resource requirements if not specified", func() {
		job := generateJobForHook(hookName, hookSpec, scan, cliArgs, serviceAccountName)

		Expect(job.Spec.Template.Spec.Containers[0].Resources.Requests[corev1.ResourceCPU]).To(Equal(resource.MustParse("200m")))
		Expect(job.Spec.Template.Spec.Containers[0].Resources.Requests[corev1.ResourceMemory]).To(Equal(resource.MustParse("100Mi")))
		Expect(job.Spec.Template.Spec.Containers[0].Resources.Limits[corev1.ResourceCPU]).To(Equal(resource.MustParse("400m")))
		Expect(job.Spec.Template.Spec.Containers[0].Resources.Limits[corev1.ResourceMemory]).To(Equal(resource.MustParse("200Mi")))
	})

	It("should use custom resource requirements if specified", func() {
		hookSpec.Resources = corev1.ResourceRequirements{
			Requests: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("300m"),
				corev1.ResourceMemory: resource.MustParse("150Mi"),
			},
			Limits: corev1.ResourceList{
				corev1.ResourceCPU:    resource.MustParse("500m"),
				corev1.ResourceMemory: resource.MustParse("250Mi"),
			},
		}

		job := generateJobForHook(hookName, hookSpec, scan, cliArgs, serviceAccountName)

		Expect(job.Spec.Template.Spec.Containers[0].Resources).To(Equal(hookSpec.Resources))
	})

	Context("Environment Variables", func() {
		It("should include standard environment variables", func() {
			job := generateJobForHook(hookName, hookSpec, scan, cliArgs, serviceAccountName)

			envVars := job.Spec.Template.Spec.Containers[0].Env
			Expect(envVars).To(ContainElement(corev1.EnvVar{
				Name: "NAMESPACE",
				ValueFrom: &corev1.EnvVarSource{
					FieldRef: &corev1.ObjectFieldSelector{
						FieldPath: "metadata.namespace",
					},
				},
			}))
			Expect(envVars).To(ContainElement(corev1.EnvVar{
				Name:  "SCAN_NAME",
				Value: scan.Name,
			}))
		})

		It("should include hook-specific environment variables", func() {
			hookSpec.Env = []corev1.EnvVar{
				{Name: "TEST_ENV", Value: "test-value"},
			}

			job := generateJobForHook(hookName, hookSpec, scan, cliArgs, serviceAccountName)

			envVars := job.Spec.Template.Spec.Containers[0].Env
			Expect(envVars).To(Equal(
				[]corev1.EnvVar{
					{
						Name:  "NAMESPACE",
						Value: "",
						ValueFrom: &corev1.EnvVarSource{
							FieldRef: &corev1.ObjectFieldSelector{
								APIVersion: "",
								FieldPath:  "metadata.namespace",
							},
						},
					},
					{Name: "SCAN_NAME", Value: "test-scan", ValueFrom: nil},
					{Name: "TEST_ENV", Value: "test-value"},
				},
			))
		})
	})
})
