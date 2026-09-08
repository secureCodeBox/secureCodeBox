---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

sidebar_label: Telemetry
title: "secureCodeBox Telemetry Data"
---

:::warning Telemetry removed in secureCodeBox 5.9.0
Telemetry collection was removed from the secureCodeBox Operator in release 5.9.0. The limited use of the collected data did not justify continued data collection or the effort of maintaining the telemetry backend.

The telemetry backend is being shut down and the DNS record for `telemetry.securecodebox.io` will be removed. secureCodeBox operators older than 5.9.0 with telemetry enabled will continue attempting to submit telemetry every 24 hours and log a failed submission after the DNS record is removed. This does not affect scans or the operator's normal operation. Upgrade to 5.9.0 or later to prevent the attempted requests.

The remaining content on this page is retained temporarily as historical documentation and will be removed in a future release.
:::

The secureCodeBox Operator collects and submits anonymized data to give the development team a vague overview on how much the secureCodeBox is actually used.

## Datapoints Collected:

The total number of datapoints collected is extremely small, and they are individually evaluated to ensure that the submitted data is as anonymous as possible.

- Installed version of the secureCodeBox Operator (e.g. `v2.0.0`)
- List of installed ScanTypes across all kubernetes Namespaces: (e.g. `['nmap', 'zap-automation-framework']`). Unofficial ScanTypes are reported as `other`, to avoid submission of confidential data.

## Collection Interval

The data is submitted every 24 hours. When the Operator starts, the first data-point is submitted one hour after the start, to give users the opportunity to disable the telemetry data submission before the first datapoints are send.

## Disabling Telemetry Data Submission

The collection of telemetry data can be completely disabled by setting the `telemetryEnabled` to `false`, e.g:

```bash
helm install securecodebox-operator oci://ghcr.io/securecodebox/helm/operator --set="telemetryEnabled=false"
```

## Telemetry Code

The entire code for both the telemetry backend and frontend is open-source and linked below.

- Telemetry Client used in secureCodeBox Operator: [telemetry client](https://github.com/secureCodeBox/secureCodeBox/blob/master/operator/internal/telemetry/telemetry.go)
- Telemetry Backend: [telemetry backend](https://github.com/secureCodeBox/telemetry)
