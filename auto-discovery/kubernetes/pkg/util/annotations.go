// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package util

import (
	"bytes"
	"fmt"
	"text/template"

	"github.com/Masterminds/sprig"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type Cluster struct {
	Name string
}

type TemplateArgs struct {
	Target    metav1.ObjectMeta
	Namespace metav1.ObjectMeta
	Cluster   Cluster
}

func RenderAnnotations(annotationsTemplates map[string]string, targetMeta metav1.ObjectMeta, namespaceMeta metav1.ObjectMeta, clusterName string) map[string]string {
	annotations := map[string]string{}

	templateArgs := TemplateArgs{
		Target:    targetMeta,
		Namespace: namespaceMeta,
		Cluster: Cluster{
			Name: clusterName,
		},
	}

	for key, value := range annotationsTemplates {
		tmpl, err := template.New(fmt.Sprintf("Annotation Template for '%s'", key)).Funcs(sprig.TxtFuncMap()).Parse(value)
		if err != nil {
			panic(err)
		}

		var rawOutput bytes.Buffer
		err = tmpl.Execute(&rawOutput, templateArgs)
		output := rawOutput.String()

		// skip empty string values to allow users to skip annotations
		if output == "" {
			continue
		}

		annotations[key] = output
	}

	return annotations
}
