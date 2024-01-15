---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Automatically Scan Your Cluster with Autodiscovery"
description: "Automatically create and update scans for Kubernetes resources"
sidebar_position: 6
---

## Introduction

The secureCodeBox allows you to set up regular scans of your infrastructure using _scheduled scans_. As the name suggests, these _scheduled scans_ run based on a predefined time interval. However, it can be cumbersome to set this up for your entire infrastructure. If you are operating your infrastructure inside a Kubernetes cluster, there is an easier way to do this: The SCB AutoDiscovery automates the process of setting up _scheduled scans_ by creating _scheduled scans_ for Kubernetes resources inside a cluster.

The AutoDiscovery will observe the scanned Kubernetes resources over their whole lifecycle. It will automatically create, update and delete scans when necessary. Currently, the secureCodeBox AutoDiscovery supports two modes that can be enabled independently: A _Service_ and a _Container_ AutoDiscovery. This tutorial will explain both modes and will give a practical step-by-step example you can follow to get started with them.

### Container AutoDiscovery

The Container AutoDiscovery will create a scheduled scan with the given parameters (see [readme](https://github.com/secureCodeBox/secureCodeBox/blob/main/auto-discovery/kubernetes/README.md) for config options) for each unique container image in a Kubernetes namespace. Currently it is only possible to scan public container images.  
It is currently disabled by default and must be enabled manually.

Assume that a namespace contains two pods that run a `nginx v1.5` container. The Container AutoDiscovery will only create a single scheduled scan for the _nginx_ containers, as both are identical.
When a third pod inside the namespace is started running a `nginx v1.6` container, the Container AutoDiscovery will create an additional scheduled scan for the `nginx v1.6` container, as it is not scanned at this point in time. The Container AutoDiscovery will look at the specific version number of each container when it determines if the container should be scanned.
When both `nginx v1.5` pods get deleted the corresponding scheduled scans will also be automatically deleted because the specific container image is no longer present in the namespace.
The scheduled scan for the `nginx v1.6` container will not be deleted, as it is still running in the namespace.

In other words: The Container AutoDiscovery will create a single scheduled scan for each unique container image (taking the specific version number into account) in a given namespace.
If a pod consists of multiple containers, the above described logic will be applied to each container individually.

### Service AutoDiscovery

The Service AutoDiscovery will create a scheduled scan with the given parameters (see [readme](https://github.com/secureCodeBox/secureCodeBox/blob/main/auto-discovery/kubernetes/README.md) for config options) for each Kubernetes service it detects. (It is possible to scan APIs that require authentication, see the [ZAP Advanced](../scanners/zap-advanced.md) documentation).
The Service AutoDiscovery is enabled by default but can be disabled manually.

The Service AutoDiscovery will ignore services where the underlying pods do not serve http(s). It does this by checking for open ports `80, 443, 3000, 5000, 8000, 8443, 8080`. It is also sufficient to name the ports `http` or `https` when a different port is used than the ports specified above.
Services without a matching port number or name are currently ignored.

## Setup

For the sake of the tutorial, it will be assumed that a Kubernetes cluster and the SCB operator is already up and running. If not, check out the [installation](/docs/getting-started/installation/) tutorial for more information.
This tutorial will use the `default` and `securecodebox-system` namespaces.

First install the `zap-advanced` (for service AutoDiscovery) and `trivy` (for Container AutoDiscovery) scan types:

```bash
helm upgrade --install zap-advanced secureCodeBox/zap-advanced
helm upgrade --install trivy secureCodeBox/trivy
```

Then install the SCB AutoDiscovery (Container AutoDiscovery is explicitly enabled in this example):

```bash
helm upgrade --namespace securecodebox-system --install auto-discovery-kubernetes secureCodeBox/auto-discovery-kubernetes --set config.containerAutoDiscovery.enabled=true
```

There are three so-called `resourceInclusionModes`. These control which resources the AutoDiscovery will scan.

- `enabled-per-namespace` (default)
- `enabled-per-resource`
- `all` (scans every service and/ or container in the whole cluster!)

Depending on the _resourceInclusionMode_ one has to annotate each namespace or Kubernetes resource for which the AutoDiscovery should be enabled. If `scan-all` is used nothing has to be annotated as everything will be scanned.
This tutorial will use `enabled-per-namespace` as _ressourceInclusionMode_ which is the default.
Annotate the `default` namespace to enable the AutoDiscovery feature for the namespace.

```bash
kubectl annotate namespace default auto-discovery.securecodebox.io/enabled=true
```

Then install juice-shop as a demo target:

```bash
helm upgrade --install juice-shop secureCodeBox/juice-shop
```

The AutoDiscovery will create two scheduled scans after some time. One for the juice-shop service using `zap`, and one for the juice-shop container using `trivy`:

```bash
$ kubectl get scheduledscans
NAME                                                             TYPE                INTERVAL   FINDINGS
juice-shop-service-port-3000                                     zap-advanced-scan   168h0m0s
scan-juice-shop-at-350cf9a6ea37138b987a3968d046e61bcd3bb18d2ec   trivy               168h0m0s
```

Install a second juice-shop into the namespace:

```bash
helm upgrade --install juice-shop2 secureCodeBox/juice-shop
```

The AutoDiscovery will then create a second `zap` scan for the service, but no additional `trivy` container scan, as the juice-shop container is already being scanned.

```bash
$ kubectl get scheduledscans
NAME                                                             TYPE                INTERVAL   FINDINGS
juice-shop-service-port-3000                                     zap-advanced-scan   168h0m0s
juice-shop2-service-port-3000                                    zap-advanced-scan   168h0m0s
scan-juice-shop-at-350cf9a6ea37138b987a3968d046e61bcd3bb18d2ec   trivy               168h0m0s
```

Delete both juice-shop deployments.

```bash
kubectl delete deployment,service juice-shop juice-shop2
```

After some time all scheduled scans will be automatically deleted.

```
$ kubectl get scheduledscans
No resources found in default namespace.
```

## Config

The scanType and scan parameters can be changed by providing `containerAutodiscovery.scanConfig.scanType` and `containerAutodiscovery.scanConfig.parameters` (replace `containerAutodiscovery` with `serviceAutodiscovery` to change scanType and scan parameters for the service AutoDiscovery).
The scan parameters support go templating extended with [_sprig_](https://github.com/Masterminds/sprig). An example for go templating would be the default parameters for the Container AutoDiscovery: `{{ .ImageID }}`. _ImageID_ is the imageID of the scanned container, example: `docker.io/bkimminich/juice-shop@sha256:350cf9a6ea37138b987a3968d046e61bcd3bb18d2ec95290cfc6901bd6013826`

All config options are automatically updated in the [readme](https://github.com/secureCodeBox/secureCodeBox/blob/main/auto-discovery/kubernetes/README.md) in the Github repository.
