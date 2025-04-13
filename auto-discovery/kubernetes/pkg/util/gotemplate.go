// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package util

import (
	"bytes"
	"fmt"
	"text/template"

	"github.com/Masterminds/sprig"
	config "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/pkg/config"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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
	if err != nil {
		panic(err)
	}

	if output != "" {
		return output
	}
	return ""
}

// ParseMapTemplate templates our all the values of the map with the given template args
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

// ParseListTemplate templates our all the values of the list with the given template args
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

func generateVolumes(scanConfig config.ScanConfig, templateArgs interface{}) []corev1.Volume {
	volumes := make([]corev1.Volume, len(scanConfig.Volumes))
	for i, volume := range scanConfig.Volumes {
		templatedVolume := volume.DeepCopy()
		templatedVolume.Name = templateOrPanic(volume.Name, templateArgs)
		if volume.Secret != nil {
			templatedVolume.Secret.SecretName = templateOrPanic(volume.Secret.SecretName, templateArgs)
		}
		if volume.ConfigMap != nil {
			templatedVolume.ConfigMap.Name = templateOrPanic(volume.ConfigMap.Name, templateArgs)
		}
		volumes[i] = *templatedVolume
	}
	return volumes
}

func generateVolumeMounts(scanConfig config.ScanConfig, templateArgs interface{}) []corev1.VolumeMount {
	volumeMounts := make([]corev1.VolumeMount, len(scanConfig.VolumeMounts))
	for i, volumeMount := range scanConfig.VolumeMounts {
		templatedVolumeMount := volumeMount.DeepCopy()
		templatedVolumeMount.Name = templateOrPanic(volumeMount.Name, templateArgs)
		templatedVolumeMount.MountPath = templateOrPanic(volumeMount.MountPath, templateArgs)
		templatedVolumeMount.SubPath = templateOrPanic(volumeMount.SubPath, templateArgs)
		templatedVolumeMount.SubPathExpr = templateOrPanic(volumeMount.SubPathExpr, templateArgs)

		volumeMounts[i] = *templatedVolumeMount
	}
	return volumeMounts
}

func generateHookSelectors(scanConfig config.ScanConfig, templateArgs interface{}) *metav1.LabelSelector {
	var hookSelector *metav1.LabelSelector = nil
	if scanConfig.HookSelector.MatchExpressions != nil {
		templatedMatchExpression := make([]metav1.LabelSelectorRequirement, len(scanConfig.HookSelector.MatchExpressions))

		for i, matchExpression := range scanConfig.HookSelector.MatchExpressions {

			templatedExpression := matchExpression.DeepCopy()
			templatedExpression.Key = templateOrPanic(matchExpression.Key, templateArgs)
			if matchExpression.Values != nil {
				values := []string{}
				for _, value := range matchExpression.Values {
					templatedValue := templateOrPanic(value, templateArgs)
					if templatedValue != "" {
						values = append(values, templatedValue)
					}
				}
				templatedExpression.Values = values
			}
			templatedMatchExpression[i] = *templatedExpression
		}

		hookSelector = &metav1.LabelSelector{
			MatchExpressions: templatedMatchExpression,
		}
	}
	if scanConfig.HookSelector.MatchLabels != nil {
		hookSelector = &metav1.LabelSelector{
			MatchLabels: ParseMapTemplate(templateArgs, scanConfig.HookSelector.MatchLabels),
		}
	}
	return hookSelector
}

func generateEnvVars(scanConfig config.ScanConfig, templateArgs interface{}) []corev1.EnvVar {
	var envVars []corev1.EnvVar = []corev1.EnvVar{}
	for _, envVar := range scanConfig.Env {
		envVarCopy := envVar.DeepCopy()
		envVarCopy.Value = templateOrPanic(envVarCopy.Value, templateArgs)
		envVars = append(envVars, *envVarCopy)
	}
	return envVars
}

// GenerateScanSpec takes in both autoDiscoveryConfig and scanConfig as this function might be used by other controllers in the future, which can then pass in the their relevant scanConfig into this function
func GenerateScanSpec(scanConfig config.ScanConfig, templateArgs interface{}) executionv1.ScheduledScanSpec {
	parameters := scanConfig.Parameters

	params := ParseListTemplate(templateArgs, parameters)

	volumes := generateVolumes(scanConfig, templateArgs)
	volumeMounts := generateVolumeMounts(scanConfig, templateArgs)
	hookSelector := generateHookSelectors(scanConfig, templateArgs)
	envVars := generateEnvVars(scanConfig, templateArgs)

	scheduledScanSpec := executionv1.ScheduledScanSpec{
		Interval: scanConfig.RepeatInterval,
		ScanSpec: &executionv1.ScanSpec{
			ScanType:     scanConfig.ScanType,
			Parameters:   params,
			Volumes:      volumes,
			VolumeMounts: volumeMounts,
			HookSelector: hookSelector,
			Env:          envVars,
		},
		RetriggerOnScanTypeChange: true,
	}

	return scheduledScanSpec
}
