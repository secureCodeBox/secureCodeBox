---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "ScanType"
sidebar_position: 4
---

The ScanType Custom Resource Definition (CRD) is used to define to the secureCodeBox how a specific scanner can be executed in Kubernetes. The main part of the ScanType is the [JobTemplate](#jobtemplate-required), which contains a Kubernetes Job definition that will be used to construct the scans Job.

## Specification (Spec)

### ExtractResults (Required)

The `extractResults` field contains an object (fields of the object listed below) which describes what types of results this scanType produced and from where these should be extracted.

#### ExtractResults.Type (Required)

The `type` field indicates the type of the file.
Usually a combination of the scanner name and file type. E.g. `nmap-xml`

The type is used to determine which parser would be used to handle this result file.

#### ExtractResults.Location (Required)

The `location` field describes from where the result file can be extracted.
The absolute path on the containers file system.

Must be located in `/home/securecodebox/` so that the result is reachable by the secureCodeBox Lurker sidecar which performs the actual extraction of the result.
E.g. `/home/securecodebox/nmap-results.xml`

### JobTemplate (Required)

Template of the Kubernetes job to create when running the scan.

For info about the JobTemplate generic parameters, see here: https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19/#job-v1-batch
When specified, as with the `ttlSecondsAfterFinished` parameter, the values from `values.yaml` will be used in the JobTemplate.

## Example

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: ScanType
metadata:
  name: "typo3scan"
spec:
  extractResults:
    type: typo3scan-json
    location: "/home/securecodebox/typo3scan.json"
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
            - name: typo3scan
              image: "{{ .Values.scanner.image.repository }}:{{ .Values.scanner.image.tag | default .Chart.AppVersion }}"
              command:
                - "python3"
                - "/home/typo3scan/typo3scan.py"
                # Remove any user-interation
                - "--no-interaction"
                # Output in json format
                - "--json"
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
