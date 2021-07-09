/*
Copyright 2021 iteratec GmbH.

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
