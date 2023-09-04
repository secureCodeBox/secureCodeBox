---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "ScheduledScan"
sidebar_position: 3
---

The ScheduledScan Custom Resource Definition (CRD) lets you define a [Scan](/docs/api/crds/scan-type/) which gets repeated in a specific time interval. E.g. every 24 hours or every 7 days.

## Specification (Spec)

### Interval (Required)

The `interval` specifies the interval between two scans.

Specified as a [golang duration string](https://golang.org/pkg/time/#ParseDuration).

:::caution
The biggest duration golang time strings support is **hours**. Longer durations e.g. days / weeks need to specified as multiples of hours.
We plan to improve this in the future, by providing a custom format which also supports days and weeks.
:::

### ScanSpec (Required)

The `scanSpec` contains the specification of the scan which should be repeated.

See the `spec` field of the [Scan CRD](/docs/api/crds/scan-type/) for all supported attributes.

### SuccessfulJobsHistoryLimit (Optional)

The `successfulJobsHistoryLimit` controls how many completed scans are supposed to be kept until the oldest one will be deleted.

Defaults to 3 if not set. When set to `0`, scans will be deleted directly after their completion.

### FailedJobsHistoryLimit (Optional)

The `failedJobsHistoryLimit` controls how many failed scans are supposed to be kept until the oldest one will be deleted.

Defaults to 1 if not set. When set to `0`, scans will be deleted directly after failure.

## Example

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: ScheduledScan
metadata:
  name: "nmap-scanme.nmap.org-daily"
spec:
  interval: 24h
  scanSpec:
    scanType: "nmap"
    parameters:
      # Use nmaps service detection feature
      - "-sV"
      - scanme.nmap.org
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
```
