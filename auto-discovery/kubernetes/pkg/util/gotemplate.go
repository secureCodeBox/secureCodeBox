package util

import (
	"bytes"
	"text/template"

	"github.com/Masterminds/sprig"
	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
)

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
