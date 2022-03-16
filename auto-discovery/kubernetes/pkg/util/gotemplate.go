package util

import (
	"bytes"
	"fmt"
	"text/template"

	"github.com/Masterminds/sprig"
	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
)

func templateOrPanic(templateString string, templateArgs interface{}) string {
	if templateString == "" {
		return ""
	}

	tmpl, err := template.New(fmt.Sprintf("Template parameter '%s'", templateString)).Funcs(sprig.TxtFuncMap()).Parse(templateString)
	if err != nil {
		panic(err)
	}

	var rawOutput bytes.Buffer
	err = tmpl.Execute(&rawOutput, templateArgs)
	output := rawOutput.String()

	if output != "" {
		return output
	}
	return ""
}

func ParseMapTemplate(templateArgs interface{}, templates map[string]string) map[string]string {
	result := map[string]string{}

	for key, value := range templates {
		data := templateOrPanic(value, templateArgs)

		if data != "" {
			result[key] = data
		}
	}
	return result
}

func ParseListTemplate(templateArgs interface{}, templates []string) []string {
	var result []string

	for _, value := range templates {
		data := templateOrPanic(value, templateArgs)

		if data != "" {
			result = append(result, data)
		}
	}
	return result
}

// Takes in both autoDiscoveryConfig and scanConfig as this function might be used by other controllers in the future, which can then pass in the their relevant scanConfig into this function
func GenerateScanSpec(scanConfig configv1.ScanConfig, templateArgs interface{}) executionv1.ScheduledScanSpec {
	parameters := scanConfig.Parameters

	params := ParseListTemplate(templateArgs, parameters)

	scheduledScanSpec := executionv1.ScheduledScanSpec{
		Interval: scanConfig.RepeatInterval,
		ScanSpec: &executionv1.ScanSpec{
			ScanType:   scanConfig.ScanType,
			Parameters: params,
		},
		RetriggerOnScanTypeChange: true,
	}

	return scheduledScanSpec
}
