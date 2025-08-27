---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "ScanType"
sidebar_position: 4
---

The ScanType Custom Resource Definition (CRD) defines how a specific scanner can be executed in Kubernetes. The main component is the [JobTemplate](#jobtemplate-required), which contains a Kubernetes Job definition used to construct the scan's Job.

## Specification (Spec)

### ExtractResults (Required)

The `extractResults` field contains an object that describes the type of results this ScanType produces and where they should be extracted from.

#### ExtractResults.Type (Required)

The `type` field indicates the format of the result file.
This is typically a combination of the scanner name and file type, such as `nmap-xml`.

This type determines which parser will be used to process the result file.

#### ExtractResults.Location (Required)

The `location` field specifies where the result file can be extracted from.
This must be an absolute path on the container's filesystem.

The file must be located within `/home/securecodebox/` so that it's accessible to the secureCodeBox Lurker sidecar, which performs the actual result extraction.
Example: `/home/securecodebox/nmap-results.xml`

### JobTemplate (Required)

Template for the Kubernetes Job to create when running the scan.

For information about JobTemplate parameters, see the [Kubernetes API Reference](https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/job-v1/#JobSpec).
When parameters like `ttlSecondsAfterFinished` are specified, values from `values.yaml` will be used in the JobTemplate.

## Status

The ScanType status is currently empty and managed entirely by Kubernetes. Future versions may include additional status information.

## Example

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: ScanType
metadata:
  name: "nmap"
spec:
  extractResults:
    type: nmap-xml
    location: "/home/securecodebox/nmap-results.xml"
  jobTemplate:
    spec:
      {{- if .Values.scanner.ttlSecondsAfterFinished }}
      ttlSecondsAfterFinished: {{ .Values.scanner.ttlSecondsAfterFinished }}
      {{- end }}
      backoffLimit: {{ .Values.scanner.backoffLimit }}
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: nmap
              image: "{{ .Values.scanner.image.repository }}:{{ .Values.scanner.image.tag | default .Chart.AppVersion }}"
              imagePullPolicy: {{ .Values.scanner.image.pullPolicy }}
              command:
                - "nmap"
                - "-oX"
                - "/home/securecodebox/nmap-results.xml"
              resources:
                {{- toYaml .Values.scanner.resources | nindent 16 }}
              securityContext:
                {{- toYaml .Values.scanner.securityContext | nindent 16 }}
              env:
                {{- toYaml .Values.scanner.env | nindent 16 }}
              volumeMounts:
                {{- toYaml .Values.scanner.extraVolumeMounts | nindent 16 }}
            {{- if .Values.scanner.extraContainers }}
            {{- toYaml .Values.scanner.extraContainers | nindent 12 }}
            {{- end }}
          volumes:
            {{- toYaml .Values.scanner.extraVolumes | nindent 12 }}
```
