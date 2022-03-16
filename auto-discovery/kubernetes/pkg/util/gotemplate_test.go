// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package util

import (
	"testing"

	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"
	"github.com/stretchr/testify/assert"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type testData struct {
	in                   map[string]string
	expectedMapKeyLength int
}

// Tests that getAnnotationsForScan drops all annotations not prefixed with "*.securecodebox.io/*"
func TestGetAnnotationsForScan(t *testing.T) {
	assert.Equal(
		t,
		render(map[string]string{"foo": "bar"}),
		map[string]string{"foo": "bar"},
		"Should render plain strings unchanged",
	)

	assert.Equal(
		t,
		render(map[string]string{"foo": "Name: {{ .Target.Name }}"}),
		map[string]string{"foo": "Name: service-foobar"},
		"Should be able to render information of the target object",
	)

	assert.Equal(
		t,
		// Need to use "index" function here to be able to access the `app.kubernetes.io/name` as the special chars ('.' & '/') mess with golang templates
		render(map[string]string{"foo": "Service: {{ index .Target.Labels `app.kubernetes.io/name` }}"}),
		map[string]string{"foo": "Service: juice-shop"},
		"Should be able to render infos from target labels",
	)

	assert.Equal(
		t,
		map[string]string{
			"defectdojo.securecodebox.io/product-name":    "test-cluster | foobar | service-foobar",
			"defectdojo.securecodebox.io/product-tags":    "cluster/test-cluster,namespace/foobar",
			"defectdojo.securecodebox.io/engagement-name": "service-foobar",
		},
		render(
			map[string]string{
				"defectdojo.securecodebox.io/product-name":    "{{ .Cluster.Name }} | {{ .Namespace.Name }} | {{ .Target.Name }}",
				"defectdojo.securecodebox.io/product-tags":    "cluster/{{ .Cluster.Name }},namespace/{{ .Namespace.Name }}",
				"defectdojo.securecodebox.io/engagement-name": "{{ .Target.Name }}",
				// Need to use "index" function here to be able to access the `app.kubernetes.io/name` as the special chars ('.' & '/') mess with golang templates
				// Should be dropped as the template renders to a empty string as the service doesn't have the version label included
				"defectdojo.securecodebox.io/engagement-version": "{{ default \"\" (index .Target.Labels `scm.securecodebox.io/branch`) }}",
			}),
		"Should be able to render out actual DefectDojo usage",
	)
}

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
