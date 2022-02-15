{{/*
    SPDX-FileCopyrightText: the secureCodeBox authors

    SPDX-License-Identifier: Apache-2.0
*/}}

{{/*
Expand the name of the chart.
*/}}
{{- define "zap.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "zap.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "zap.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "zap.labels" -}}
app: {{ .Release.Name | trunc 63 | trimSuffix "-" }}
chart: {{ include "zap.chart" . }}
release: {{ .Release.Name | trunc 63 | trimSuffix "-" }}
heritage: {{ .Release.Service }}
{{- end -}}

{{/*
Create the name of the service
*/}}
{{- define "zap.makeServiceName" -}}
    {{- $servicename := tpl (.Values.application.serviceName | toString) $ -}}
    {{- printf "%s" $servicename -}}
{{- end -}}
