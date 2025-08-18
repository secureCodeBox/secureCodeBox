---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "ScheduledScan"
sidebar_position: 3
---

The ScheduledScan Custom Resource Definition (CRD) lets you define a [Scan](/docs/api/crds/scan-type/) that gets repeated at specific time intervals, such as every 24 hours or every 7 days.

## Specification (Spec)

### Interval

The `interval` specifies the time interval between consecutive scans.
Either [`interval`](#interval) or [`schedule`](#schedule) must be set, as they are mutually exclusive.

Specified as a [golang duration string](https://golang.org/pkg/time/#ParseDuration).

E.g. `24h` for 24 hours, or `1h30m` for 1 hour and 30 minutes.

:::caution
The largest duration unit that golang time strings support is **hours**. Longer durations (e.g., days or weeks) must be specified as multiples of hours.
We plan to improve this in the future by providing a custom format that also supports days and weeks.
:::

### Schedule

The `schedule` lets you define a [cron expression](https://en.wikipedia.org/wiki/Cron) to control precisely when the scan is executed.
Either [`interval`](#interval) or [`schedule`](#schedule) must be set, as they are mutually exclusive.

### ScanSpec (Required)

The `scanSpec` contains the specification of the scan which should be repeated.

See the `spec` field of the [Scan CRD](/docs/api/crds/scan-type/) for all supported attributes.

### SuccessfulJobsHistoryLimit (Optional)

The `successfulJobsHistoryLimit` controls how many completed scans are retained before the oldest ones are deleted.

Defaults to 3 if not set. When set to `0`, scans are deleted immediately after completion.

### FailedJobsHistoryLimit (Optional)

The `failedJobsHistoryLimit` controls how many failed scans are retained before the oldest ones are deleted.

Defaults to 3 if not set. When set to `0`, scans are deleted immediately after failure.

### ConcurrencyPolicy (Optional)

The `concurrencyPolicy` specifies how to treat concurrent executions of a ScheduledScan. Valid values are:

- `"Allow"` (default): allows scheduled scans to run concurrently
- `"Forbid"`: forbids concurrent runs, skipping the next run if the previous run hasn't finished yet
- `"Replace"`: cancels the currently running scan and replaces it with a new one

### RetriggerOnScanTypeChange (Optional)

When `retriggerOnScanTypeChange` is enabled, it will automatically trigger a new scan if the referenced ScanType is updated.

Defaults to `false` if not set.

## Example with an Interval

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
      # Use nmap's service detection feature
      - "-sV"
      - scanme.nmap.org
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  concurrencyPolicy: "Allow"
  retriggerOnScanTypeChange: false
```

## Example with a Cron Schedule

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: ScheduledScan
metadata:
  name: "nmap-scanme.nmap.org-daily-noon"
spec:
  schedule: "0 12 * * *"
  scanSpec:
    scanType: "nmap"
    parameters:
      # Use nmap's service detection feature
      - "-sV"
      - scanme.nmap.org
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  concurrencyPolicy: "Forbid"
  retriggerOnScanTypeChange: true
```
