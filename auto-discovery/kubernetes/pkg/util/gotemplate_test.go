// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package util

import (
	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

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

	type TestTemplateArgs struct {
		Target    metav1.ObjectMeta
		Namespace corev1.Namespace
		Cluster   configv1.ClusterConfig
	}
	templateArgs := TestTemplateArgs{
		Target:    targetMeta,
		Namespace: namespace,
		Cluster:   configv1.ClusterConfig{Name: "test-cluster"},
	}
	return ParseMapTemplate(templateArgs, annotationTemplates)
}
