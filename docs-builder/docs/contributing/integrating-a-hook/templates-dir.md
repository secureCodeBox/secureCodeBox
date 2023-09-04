---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: templates (Directory)
sidebar_position: 6
---

## new-hook.yaml

This file contains the specification of your new hook. Please take a look at [ScanCompletionHook | secureCodeBox](/docs/api/crds/scan-completion-hook) on how to configure your `ScanCompletionHook`

## Example

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: ScanCompletionHook
metadata:
  name: {{ include "generic-webhook.fullname" . }}
  labels: {{ - include "generic-webhook.labels" . | nindent 4 }}
spec:
  type: ReadOnly
  image: "{{ .Values.hook.image.repository }}:{{ .Values.hook.image.tag | default .Chart.Version }}"
  ttlSecondsAfterFinished: {{ .Values.hook.ttlSecondsAfterFinished }}
  env:
    - name: WEBHOOK_URL
      value: {{ .Values.webhookUrl | quote }}
  affinity: {{ - toYaml .Values.hook.affinity | nindent 4 }}
  tolerations: {{ - toYaml .Values.hook.tolerations | nindent 4 }}
```
