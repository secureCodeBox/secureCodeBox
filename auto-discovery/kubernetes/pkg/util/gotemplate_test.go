// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package util

import (
	"time"

	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

type TestTemplateArgs struct {
	Target    metav1.ObjectMeta
	Namespace corev1.Namespace
	Cluster   configv1.ClusterConfig
}

var _ = Describe("gotemplate helper util", func() {

	Context("Annotation Templating Scanner Parameter", func() {
		It("Should render simple static annoation without templating", func() {
			Expect(render(map[string]string{"foo": "bar"})).To(Equal(
				map[string]string{"foo": "bar"},
			))
		})

		It("Should render out simple template strings", func() {
			Expect(render(map[string]string{"foo": "Name: {{ .Target.Name }}"})).To(Equal(
				map[string]string{"foo": "Name: service-foobar"},
			))
		})

		It("Should render out more complex template strings", func() {
			Expect(render(map[string]string{"foo": "Service: {{ index .Target.Labels `app.kubernetes.io/name` }}"})).To(Equal(
				map[string]string{"foo": "Service: juice-shop"},
			))
		})

		It("Should drop annotations which render to an empty string", func() {
			Expect(
				render(map[string]string{
					"defectdojo.securecodebox.io/product-name":    "{{ .Cluster.Name }} | {{ .Namespace.Name }} | {{ .Target.Name }}",
					"defectdojo.securecodebox.io/product-tags":    "cluster/{{ .Cluster.Name }},namespace/{{ .Namespace.Name }}",
					"defectdojo.securecodebox.io/engagement-name": "{{ .Target.Name }}",
					// Need to use "index" function here to be able to access the `app.kubernetes.io/name` as the special chars ('.' & '/') mess with golang templates
					// Should be dropped as the template renders to a empty string as the service doesn't have the version label included
					"defectdojo.securecodebox.io/engagement-version": "{{ default \"\" (index .Target.Labels `scm.securecodebox.io/branch`) }}",
				}),
			).To(Equal(
				map[string]string{
					"defectdojo.securecodebox.io/product-name":    "test-cluster | foobar | service-foobar",
					"defectdojo.securecodebox.io/product-tags":    "cluster/test-cluster,namespace/foobar",
					"defectdojo.securecodebox.io/engagement-name": "service-foobar",
				},
			))
		})
	})

	Context("Template Scanner Parameter", func() {
		It("Should template Volume & VolumeMounts", func() {

			templateArgs := TestTemplateArgs{
				Target: metav1.ObjectMeta{
					Name:      "foobar",
					Namespace: "barfoo",
				},
				Namespace: corev1.Namespace{
					ObjectMeta: metav1.ObjectMeta{
						Name: "barfoo",
					},
				},
				Cluster: configv1.ClusterConfig{
					Name: "test-cluster",
				},
			}

			scanConfig := configv1.ScanConfig{
				RepeatInterval: metav1.Duration{Duration: time.Hour},
				Annotations:    map[string]string{},
				Labels:         map[string]string{},
				Parameters:     []string{"-p", "3000", "{{ .Target.Name }}.{{ .Namespace.Name }}.svc"},
				ScanType:       "nmap",
				Volumes: []corev1.Volume{
					{
						Name: "{{ .Target.Name | upper }}",
						VolumeSource: corev1.VolumeSource{
							Secret: &corev1.SecretVolumeSource{
								SecretName: "scan-overwrite-{{ .Target.Name }}",
							},
						},
					},
				},
				VolumeMounts: []corev1.VolumeMount{
					{
						Name:      "{{ .Target.Name | upper }}",
						MountPath: "/tmp/foobar/test.txt",
						SubPath:   "test.txt",
					},
					{
						Name:      "{{ .Target.Name | upper }}",
						MountPath: "/tmp/barfoo/test.txt",
						SubPath:   "test.txt",
					},
				},
			}

			scanSpec := GenerateScanSpec(scanConfig, templateArgs)

			Expect(scanSpec.ScanSpec.ScanType).To(Equal("nmap"))
			Expect(scanSpec.ScanSpec.Volumes).To(ContainElement(corev1.Volume{
				Name: "FOOBAR",
				VolumeSource: corev1.VolumeSource{
					Secret: &corev1.SecretVolumeSource{
						SecretName: "scan-overwrite-foobar",
					},
				},
			}))
			Expect(scanSpec.ScanSpec.VolumeMounts).To(ContainElement(corev1.VolumeMount{
				Name:      "FOOBAR",
				MountPath: "/tmp/foobar/test.txt",
				SubPath:   "test.txt",
			}))
			Expect(scanSpec.ScanSpec.VolumeMounts).To(ContainElement(corev1.VolumeMount{
				Name:      "FOOBAR",
				MountPath: "/tmp/barfoo/test.txt",
				SubPath:   "test.txt",
			}))
		})

		Context("HookSelectors", func() {
			templateArgs := TestTemplateArgs{
				Target: metav1.ObjectMeta{
					Name:      "foobar",
					Namespace: "barfoo",
				},
				Namespace: corev1.Namespace{
					ObjectMeta: metav1.ObjectMeta{
						Name: "barfoo",
					},
				},
				Cluster: configv1.ClusterConfig{
					Name: "test-cluster",
				},
			}

			It("should work with empty list of matchExpression", func() {
				scanConfig := configv1.ScanConfig{
					RepeatInterval: metav1.Duration{Duration: time.Hour},
					Annotations:    map[string]string{},
					Labels:         map[string]string{},
					Parameters:     []string{"-p", "3000", "{{ .Target.Name }}.{{ .Namespace.Name }}.svc"},
					ScanType:       "nmap",
					HookSelector: metav1.LabelSelector{
						MatchExpressions: []metav1.LabelSelectorRequirement{
							{
								Key:      "{{ .Target.Name }}",
								Operator: metav1.LabelSelectorOpIn,
								Values: []string{
									"defectdojo",
									"{{ if eq .Target.Namespace `foobar` }}notification-email{{ end }}",
									"{{ if eq .Target.Namespace `barfoo` }}notification-slack{{ end }}",
								},
							},
							{
								Key:      "ignore-{{ `this` }}",
								Operator: metav1.LabelSelectorOpDoesNotExist,
							},
						},
					},
				}

				scanSpec := GenerateScanSpec(scanConfig, templateArgs)

				Expect(scanSpec.ScanSpec.ScanType).To(Equal("nmap"))
				Expect(scanSpec.ScanSpec.HookSelector.MatchExpressions).To(ContainElement(metav1.LabelSelectorRequirement{
					Key:      "foobar",
					Operator: metav1.LabelSelectorOpIn,
					Values: []string{
						"defectdojo",
						"notification-slack",
					},
				}))
				Expect(scanSpec.ScanSpec.HookSelector.MatchExpressions).To(ContainElement(metav1.LabelSelectorRequirement{
					Key:      "ignore-this",
					Operator: metav1.LabelSelectorOpDoesNotExist,
				}))
			})

			It("should work a a list of multiple matchExpressions", func() {
				scanConfig := configv1.ScanConfig{
					RepeatInterval: metav1.Duration{Duration: time.Hour},
					Annotations:    map[string]string{},
					Labels:         map[string]string{},
					Parameters:     []string{"-p", "3000", "{{ .Target.Name }}.{{ .Namespace.Name }}.svc"},
					ScanType:       "nmap",
					HookSelector: metav1.LabelSelector{
						MatchExpressions: []metav1.LabelSelectorRequirement{},
					},
				}

				scanSpec := GenerateScanSpec(scanConfig, templateArgs)

				Expect(scanSpec.ScanSpec.ScanType).To(Equal("nmap"))
				Expect(scanSpec.ScanSpec.HookSelector.MatchExpressions).To(BeEmpty())
			})

			It("should template with matchLabels", func() {
				scanConfig := configv1.ScanConfig{
					RepeatInterval: metav1.Duration{Duration: time.Hour},
					Annotations:    map[string]string{},
					Labels:         map[string]string{},
					Parameters:     []string{"-p", "3000", "{{ .Target.Name }}.{{ .Namespace.Name }}.svc"},
					ScanType:       "nmap",
					HookSelector: metav1.LabelSelector{
						MatchLabels: map[string]string{
							"foo": "bar",
							"bar": "{{ .Target.Name }}",
						},
					},
				}

				scanSpec := GenerateScanSpec(scanConfig, templateArgs)

				Expect(scanSpec.ScanSpec.ScanType).To(Equal("nmap"))
				Expect(scanSpec.ScanSpec.HookSelector.MatchLabels).To(BeEquivalentTo(map[string]string{
					"foo": "bar",
					"bar": "foobar",
				}))
			})
		})
	})
})

func render(annotationTemplates map[string]string) map[string]string {
	targetMeta := metav1.ObjectMeta{Name: "service-foobar", Namespace: "foobar", Labels: map[string]string{
		"foo":                    "bar",
		"app.kubernetes.io/name": "juice-shop",
		// "scm.securecodebox.io/branch": "v12.2.2",
	}}
	namespace := corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{Name: "foobar", Labels: map[string]string{"foo": "bar"}},
		Spec:       corev1.NamespaceSpec{},
	}

	templateArgs := TestTemplateArgs{
		Target:    targetMeta,
		Namespace: namespace,
		Cluster:   configv1.ClusterConfig{Name: "test-cluster"},
	}
	return ParseMapTemplate(templateArgs, annotationTemplates)
}
