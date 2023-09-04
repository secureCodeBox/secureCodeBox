---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: templates (Directory)
sidebar_position: 7
---

The `templates` directory contains multiple files and dirs per default (using `helm create`).
Those are not needed and should be deleted.
For the _secureCodeBox_ we will need files for the `ScanType`, `ParseDefinition` and `CascadingRule`.
Please replace _new-scanner_ with the name of your scanner for the following files.

### new-scanner-scan-type.yaml

This file contains the Specification of your `ScanType`.
Please take a look at [ScanType | secureCodeBox](/docs/api/crds/scan-type) on how to configure your `ScanType`.

### new-scanner-parse-definition.yaml

This file contains the ParseDefinition of your scanner.
We use the convention where the values to the parse definition are taken from the `values.yaml` in the scanner's folder.

#### Example

```yaml
apiVersion: execution.securecodebox.io/v1
kind: ParseDefinition
metadata:
  name: zap-json
spec:
  image: "{{ .Values.parser.image.repository }}:{{ .Values.parser.image.tag | default .Chart.Version }}"
  ttlSecondsAfterFinished: {{ .Values.parser.ttlSecondsAfterFinished }}
  env: {{ - toYaml .Values.parser.env | nindent 4 }}
```

More information under [ParseDefinition | secureCodeBox](/docs/api/crds/parse-definition)

### cascading-rules.yaml

The `CascadingRules` define under which conditions your scanner will be run after other scanners.
Please take a look at [CascadingRule | secureCodeBox](/docs/api/crds/cascading-rule) on how to configure your `CascadingRules`.
The CascadingRules are not directly in the /templates directory as their curly bracket syntax clashes with helms templates.
We import them as raw files to avoid these clashes as escaping them is even more messy.
Your `cascading-rules.yaml` should look like the following:

```yaml
# We only want to import the default cascading rules if they are enabled
{{ if .Values.cascadingRules.enabled }}
{{ range $path, $_ :=  .Files.Glob  "cascading-rules/*" }}
# Include File
{{ $.Files.Get $path }}
# Separate multiple files
---
{{ end }}
{{ end }}
```

In addition, you should add the following to your `values.yaml` to allow that the inclusion of the default cascading rules of your scanner can be skipped:

```yaml
cascadingRules:
  # cascadingRules.enabled -- Enables or disables the installation of the default cascading rules for this scanner
  enabled: true
```
