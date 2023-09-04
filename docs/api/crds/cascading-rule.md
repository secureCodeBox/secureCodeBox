---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "CascadingRule"
sidebar_position: 7
---

## Specification (Spec)

CascadingRules are Custom Resource Definitions (CRD's) used to define how scans can be started automatically based on the results of previous scans. This lets you run large exploratory scans and automatically start more in depth scans on the targets found by the initial scans.

You can find a more concrete example on how this works in the [network scanning how-to](/docs/how-tos/scanning-networks).

### Matches (Required)

### Matches.AnyOf (Required)

The `matches.anyOf` fields consists of a list of objects / hashes.
These objects are compared using a partial deep comparison, meaning that all field of the object must exactly match the finding.

If multiple anyOf rules are specified at least one must match the finding.
If multiple rules are matching, the CascadingRule will still only create one scan.

### ScanLabels & ScanAnnotations (Optional)

Configures additional labels/annotations/ added to each subsequent scan (child). These labels/annotations overwrite any existing labels/annotations. You can use a simple templating scheme to gather details about the parent scan or finding (use `{{variable}}`, see example below). The following variables are available:

- The parent [scan](/docs/api/crds/scan) (e.g. `metadata.name`).
- The related [finding](/docs/api/finding) (e.g. `category`, `attributes.hostname`).
- Custom variables (prepended with `$.`):
  - `hostOrIP`: `finding.hostname || finding.ip_address`

If you need more custom variables, please don't hesitate to [create an issue](https://github.com/secureCodeBox/secureCodeBox/issues/new?assignees=&labels=enhancement&template=feature_request.md)!

### ScanSpec (Required)

Contains the [spec of the scan](/docs/api/crds/scan#specification-spec) which is supposed to be started of the a finding matches the CascadingRule.

The `scanType`, `parameters`, values specified in `env` variables, as well as the `command` and `env` of any included `initContainers`, can use [mustache](https://mustache.github.io/mustache.5.html) templates to refer to fields of the finding the CascadingRule has been applied to. The finding is passed in directly into the mustache templating call, so that fields of the findings can be directly referenced. E.g. the location can be directly referred to by: `{{location}}`.

For convenience a helper object has been added to the mustache call under the `$` shorthand.

This helper object has the following attributes:

- `$.hostOrIP` returns either the hostname (if available) or the hostname of the current finding.

## Example

```yaml
apiVersion: "cascading.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "zap-http"
  labels:
    securecodebox.io/invasive: non-invasive
    securecodebox.io/intensive: medium
spec:
  matches:
    anyOf:
      - category: "Open Port"
        attributes:
          service: http
          state: open
      - category: "Open Port"
        attributes:
          service: https
          state: open
  scanLabels:
    mynewlabel: {{ metadata.name }}
  scanAnnotations:
    defectdojo.securecodebox.io/product-name: "{{$.hostOrIP}}"
    defectdojo.securecodebox.io/product-type-name: "{{metadata.labels.organization}}"
    defectdojo.securecodebox.io/engagement-name: "{{metadata.name}}"
    mynewannotation: "{{category}}"
  scanSpec:
    scanType: "zap-baseline"
    parameters: ["-t", "{{attributes.service}}://{{$.hostOrIP}}"]
```
