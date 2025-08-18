---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "CascadingRule"
sidebar_position: 7
---

CascadingRules are Custom Resource Definitions (CRDs) used to define how scans can be started automatically based on the results of previous scans. This allows you to run large exploratory scans and automatically start more in-depth scans on the targets found by the initial scans.

You can find a more concrete example of how this works in the [network scanning how-to](/docs/how-tos/scanning-networks).

## Specification (Spec)

### Matches (Required)

The `matches` field defines which findings should trigger the CascadingRule.

#### Matches.AnyOf (Required)

The `matches.anyOf` field consists of a list of matching rules.
These rules are compared using a partial deep comparison, meaning that all specified fields in the rule must exactly match the corresponding fields in the finding.

If multiple `anyOf` rules are specified, at least one must match the finding.
If multiple rules match, the CascadingRule will still only create one scan.

Each rule can match against the following finding fields:

- `name`: The name of the finding
- `category`: The category of the finding (e.g., "Open Port", "Subdomain")
- `description`: The description of the finding
- `location`: The location where the finding was discovered
- `severity`: The severity level (e.g., "HIGH", "MEDIUM", "LOW", "INFORMATIONAL")
- `osi_layer`: The OSI layer (e.g., "NETWORK", "APPLICATION")
- `attributes`: Key-value pairs of additional finding attributes (supports string and numeric values)

### ScanLabels & ScanAnnotations (Optional)

Configures additional labels and annotations added to each subsequent scan (child). These labels and annotations override any existing ones. You can use a simple templating scheme to gather details about the parent scan or finding (use `{{variable}}`, see example below). The following variables are available:

- The parent [scan](/docs/api/crds/scan) (e.g., `{{metadata.name}}`).
- The related [finding](/docs/api/finding) (e.g., `{{category}}`, `{{attributes.hostname}}`).
- Custom variables (prepended with `$.`):
  - `{{$.hostOrIP}}`: Returns `finding.hostname || finding.ip_address`

If you need more custom variables, please don't hesitate to [create an issue](https://github.com/secureCodeBox/secureCodeBox/issues/new?assignees=&labels=enhancement&template=feature_request.md)!

### ScanSpec (Required)

Contains the [spec of the scan](/docs/api/crds/scan#specification-spec) that should be started when a finding matches the CascadingRule.

The `scanType`, `parameters`, values specified in `env` variables, as well as the `command` and `env` of any included `initContainers`, can use [Mustache](https://mustache.github.io/mustache.5.html) templates to refer to fields of the finding the CascadingRule has been applied to. The finding is passed directly into the Mustache templating call, so finding fields can be directly referenced. For example, the location can be referenced as: `{{location}}`.

For convenience, a helper object has been added to the Mustache call under the `$` shorthand.

This helper object has the following attributes:

- `{{$.hostOrIP}}` returns either the hostname (if available) or the IP address of the current finding.

## Status

The CascadingRule status is currently empty and managed entirely by Kubernetes. Future versions may include additional status information such as the number of scans triggered by this rule.

## Example

```yaml
apiVersion: "cascading.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "nmap-hostscan"
  labels:
    securecodebox.io/invasive: non-invasive
    securecodebox.io/intensive: light
spec:
  matches:
    anyOf:
      - category: "Open Port"
        attributes:
          state: "open"
      - category: "Subdomain"
        osi_layer: "NETWORK"
      - name: "HTTP Service"
        severity: "INFORMATIONAL"
  scanLabels:
    scan.securecodebox.io/cascade-from: "{{metadata.name}}"
    scan.securecodebox.io/finding-category: "{{category}}"
  scanAnnotations:
    cascading.securecodebox.io/matched-finding: "{{name}}"
    cascading.securecodebox.io/target-host: "{{$.hostOrIP}}"
  scanSpec:
    scanType: "nmap"
    parameters:
      # Treat all hosts as online -- skip host discovery
      - "-Pn"
      # Perform service version detection
      - "-sV"
      # Target the specific host/port from the finding
      - "{{$.hostOrIP}}"
    env:
      - name: TARGET_HOST
        value: "{{$.hostOrIP}}"
      - name: FINDING_CATEGORY
        value: "{{category}}"
```
