---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "AutoDiscovery Installation & Configuration"
sidebar_label: "Installation & Configuration"
path: "docs/auto-discovery/installation"
sidebar_position: 1
---

## Installation

The secureCodeBox (SCB) AutoDiscovery is packaged as a helm chart. As the AutoDiscovery works by creating (Scheduled)Scan custom resources for the discovered resources it requires the operator to be installed first.

```bash
helm install --namespace securecodebox-system auto-discovery-kubernetes secureCodeBox/auto-discovery-kubernetes
```

## Configuration

The AutoDiscovery chart can be modified by overwriting its default values using helm. See [helm install documentation](https://helm.sh/docs/intro/using_helm/#helm-install-installing-a-package)

The values used by the AutoDiscovery chart are documented in the [AutoDiscovery Readme](https://github.com/secureCodeBox/secureCodeBox/tree/main/auto-discovery/kubernetes#values), or if you prefer the yaml representation in the [default values](https://github.com/secureCodeBox/secureCodeBox/blob/main/auto-discovery/kubernetes/values.yaml).

The config values in the `config` attribute, e.g. `config.serviceAutoDiscovery.enabled`, are used to modify the actual AutoDiscovery behavior.

### Gradual AutoDiscovery Rollout

To ease the rollout of the auto-discovery in already existing clusters the auto-discovery by default only works on namespaces specifically enabled by an annotation. This is meant to ensure that the enablement of the auto-discovery can be done in steps, e.g. one team at a time, and to ensure that the initial setup doesn't overwhelm the cluster by creating scans for every resource in it.

This behavior can be configured using one of the following `resourceInclusion` modes:

- enabled-per-namespace (default) : scans discovered resources in namespaces marked as enabled by an annotation
- enabled-per-resource :  only scans resources marked as enabled by an annotation
- all (scans every resource in the whole cluster!)
  
These modes can be set via the `config.resourceInclusion` parameter in the helm chart:

```bash
helm upgrade --namespace securecodebox-system --install auto-discovery-kubernetes secureCodeBox/auto-discovery-kubernetes --set config.resourceInclusion.mode="enabled-per-resource"
```

The default mode is `enabled-per-namespace`.

Depending on the resourceInclusionMode one has to annotate each namespace or Kubernetes resource for which the AutoDiscovery should be enabled. If `all` is used nothing has to be annotated as everything will be scanned (Which is not recommended unless you know what you're doing). These modes ease the gradual rollout to your cluster.

To enable the AutoDiscovery for a namespace/resource one has to annotate it with `securecodebox.io/auto-discovery: "true"`:

Annotating a namespace can be done as follows. Here the default namespace is annotated:

```bash
kubectl annotate namespace default auto-discovery.securecodebox.io/enabled=true
```
Annotating a individual resource is done as follows. Here the deployment `juice-shop` in the namespace `default` is annotated.

It is done by adding the annotation to the chart values, which is then passed to the deployment template. This results into the pod containing the service/deployment always having the annotation. The process may be different in your case:

```bash
helm upgrade --install juice-shop secureCodeBox/juice-shop  --set-json='annotations={"auto-discovery.securecodebox.io/enabled":"true"}'
```

You should now see a ZAP-advanced [ScheduledScan](/docs/api/crds/scheduled-scan) created for juice-shop or any other service that you have annotated.

```bash
$ kubectl get scheduledscans.execution.securecodebox.io 
NAME                                                             TYPE                INTERVAL   FINDINGS
juice-shop-service-port-3000                                     zap-advanced-scan   168h0m0s   5
```