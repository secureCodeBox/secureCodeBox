---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Service AutoDiscovery"
sidebar_label: "Service AutoDiscovery"
path: "docs/auto-discovery/service-auto-discovery"
sidebar_position: 2
---

The Service AutoDiscovery will create a `ScheduledScan` with the given parameters (see [readme](https://github.com/secureCodeBox/secureCodeBox/blob/main/auto-discovery/kubernetes/README.md) for config options) for each Kubernetes `Service` it detects.

The Service AutoDiscovery will ignore services where the underlying pods do not serve http(s). It does this by checking for open ports `80, 443, 3000, 5000, 8000, 8443, 8080`. It is also sufficient to name the ports `http` or `https` when a different port is used than the ports specified above.
Services without a matching port number or name are currently ignored.

By default the Service AutoDiscovery creates [ZAP Automation Framework](../scanners/zap-automation-framework.md) for each service. These scans are relatively generic and don't include any configuration regarding authentication / authorization. As the setup and configuration of the zap-automation-framework Chart is located in each namespace it is possible to tweak the default configuration to support authenticated and more highly configured scans. For guides on how to configure ZAP Automation Framework refer to the [ZAP Automation Framework Documentation](../scanners/zap-automation-framework.md).

### Setup

By default the Service AutoDiscovery creates ScheduledScans using the [ZAP Automation Framework](/docs/scanners/zap-automation-framework) `ScanType`. It must be installed in the same namespace as the containers you wish to scan. The following steps will install `zap-automation-framework` in the `default` namespace:

```bash
helm upgrade --install zap-automation-framework oci://ghcr.io/securecodebox/helm/zap-automation-framework
```

#### Deactivation

The Service AutoDiscovery is enabled by default but can be disabled manually.

```bash
helm upgrade --namespace securecodebox-system --install auto-discovery-kubernetes oci://ghcr.io/securecodebox/helm/auto-discovery-kubernetes --set config.serviceAutoDiscovery.enabled=false
```
