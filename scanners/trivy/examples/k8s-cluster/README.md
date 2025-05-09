<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->

This example shows how to use the `trivy k8s` scan with the secureCodeBox to scan an entire cluster with trivy.

Note: To scan the entire cluster you need to set the `k8sScanScope=cluster` for the trivy ScanType, otherwise the scanner doesn't have sufficient RBAC permissions to access all resources.

```bash
helm upgrade --install trivy oci://ghcr.io/securecodebox/helm/trivy --set="k8sScanScope=cluster"
```
