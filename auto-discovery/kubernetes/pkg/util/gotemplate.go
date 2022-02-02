package util

import (
	"bytes"
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
	ImageID   string
}

func ParseMapTemplate(dataStruct interface{}, templates map[string]string) map[string]string {
	result := map[string]string{}

	for key, value := range templates {
		tmpl, err := template.New(key).Funcs(sprig.TxtFuncMap()).Parse(value)

		if err != nil {
			panic(err)
		}

		var tmp bytes.Buffer
		tmpl.Execute(&tmp, dataStruct)
		data := tmp.String()

		if data != "" {
			result[key] = tmp.String()
		}
	}
	return result
}

func ParseListTemplate(dataStruct interface{}, templates []string) []string {
	var result []string

	for _, value := range templates {
		tmpl, err := template.New(value).Parse(value)

		if err != nil {
			panic(err)
		}

		var tmp bytes.Buffer
		tmpl.Execute(&tmp, dataStruct)
		data := tmp.String()

		if data != "" {
			result = append(result, data)
		}
	}
	return result
}
