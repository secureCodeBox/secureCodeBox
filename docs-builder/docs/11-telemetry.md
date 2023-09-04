---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

sidebar_label: Telemetry
title: "secureCodeBox Telemetry Data"
---

The secureCodeBox Operator collects and submits anonymized data to give the development team a vague overview on how much the secureCodeBox is actually used.

## Datapoints Collected:

The total number of datapoints collected is extremely small, and they are individually evaluated to ensure that the submitted data is as anonymous as possible.

- Installed version of the secureCodeBox Operator (e.g. `v2.0.0`)
- List of installed ScanTypes across all kubernetes Namespaces: (e.g. `['nmap', 'zap-baseline']`). Unofficial ScanTypes are reported as `other`, to avoid submission of confidential data.

## Collection Interval

The data is submitted every 24 hours. When the Operator starts, the first data-point is submitted one hour after the start, to give users the opportunity to disable the telemetry data submission before the first datapoints are send.

## Disabling Telemetry Data Submission

The collection of telemetry data can be completely disabled by setting the `telemetryEnabled` to `false`, e.g:

```bash
helm install securecodebox-operator secureCodeBox/operator --set="telemetryEnabled=false"
```

## Telemetry Code

The entire code for both the telemetry backend and frontend is open-source and linked below.

- Telemetry Client used in secureCodeBox Operator: [telemetry client](https://github.com/secureCodeBox/secureCodeBox/blob/master/operator/internal/telemetry/telemetry.go)
- Telemetry Backend: [telemetry backend](https://github.com/secureCodeBox/telemetry)
