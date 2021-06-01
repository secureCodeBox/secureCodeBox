---
title: "Kubernetes AutoDiscovery"
category: "system"
type: "operator"
state: "released"
usecase: "Detects new K8S resources and schedules scans automatically"
---

The secureCodeBox _AutoDiscovery_ is running on kubernetes (K8S) and is an optional component of the complete secureCodeBox stack.
The Kubernetes AutoDiscovery needs to be deployed along side the secureCodeBox Operator. It monitors security relevant resources inside a K8S environment and automatically create scans to continuously monitor security aspects of the resources.

<!-- end -->

The AutoDiscovery controller will automatically detect these new resources (services) and start secureCodeBox _scans_ for them:

1. A ZAP Baseline Scan to detect basic web vulnerabilities in the service. (Using OWASP ZAP)
2. (WIP) A image scan scanning for vulnerable libraries in the docker / container image of the deployment. (Using trivy)
3. (WIP) A TLS Scan against the certificate of the ingress for the host. (Using SSLyze)

The AutoDiscovery automatically tracks the lifecycle of the kubernetes resources and will automatically start new scans for new application versions.

## Example

<p align="center">
  <img width="950" src="./auto-discovery-demo.svg" alt="AutoDiscovery CLI Example">
</p>

This example deploys [JuiceShop](https://owasp.org/www-project-juice-shop/) to a new Kubernetes Namespace.
(You can find the kubernetes manifests for the deployment [here](./demo/juice-shop.yaml))

The AutoDiscovery will automatically pick up this new deployment and then starts a OWASP ZAP Scan against it.
The scan created uses our `zap-advanced` ScanType by default, this can be changed with the `config.serviceAutoDiscovery.scanConfig.scanType` config on the autoDiscovery helm release.

## Deployment

### Prerequisites

The secureCodeBox _AutoDiscovery_ can be deployed via helm (into the same namespace as the secureCodeBox Operator, e.g. _securecodebox-system_):

```bash
helm install securecodebox-operator secureCodeBox/auto-discovery -n securecodebox-system
```

> The _AutoDiscovery_ depends on the secureCodeBox Operator to be installed in the same cluster as the AutoDiscovery.

## AutoDiscovery Configuration

### In / Excluding Resources from the AutoDiscovery

The AutoDiscovery allows different modes to determine if a resource is supposed to be scanned.
These modes allow you to gradually roll out the AutoDiscovery in a cluster.
This allows to roll it out in cluster without a "big bang" where the AutoDiscovery starts a scan for every app in the cluster which would likely exhaust the clusters compute resources.

The three different modes are:

1. `enabled-per-namespace` (default): [See section](#enabled-per-namespace-mode-default)
2. `enabled-per-resource`: [See section](#enabled-per-resource-mode)
3. `scan-all`: [See section](#scan-all-mode)

#### Enabled per Namespace Mode (default)

Enable this by setting `config.resourceInclusion.mode=enable-per-namespace`.

This mode will start scans for resources in namespaces with the annotation `auto-discovery.securecodebox.io/enabled=true`.

```bash
# enable AutoDiscovery in namespace "juice-shop"
kubectl annotate namespace juice-shop auto-discovery.securecodebox.io/enabled=true
```

If you want to exclude a certain resource in a otherwise AutoDiscovery enabled namespace, you can exclude it by annotating it with `auto-discovery.securecodebox.io/ignore=true`.

```bash
# disable AutoDiscovery for service "foobar"
kubectl -n juice-shop annotate service foobar auto-discovery.securecodebox.io/ignore=true
```

#### Enabled per Resource Mode

Enable this by setting `config.resourceInclusion.mode=enabled-per-resource`.

This mode will start scans for every resources with the annotation `auto-discovery.securecodebox.io/enabled=true`.

```bash
# enable AutoDiscovery for service "juice-shop"
kubectl -n juice-shop annotate service juice-shop auto-discovery.securecodebox.io/enabled=true
```

#### Scan All Mode

Enable this by setting `config.resourceInclusion.mode=scan-all`.

This mode will start scans for **every** resources in the cluster **unless** it has the annotation `auto-discovery.securecodebox.io/ignore=true`.

> ⚠️ Using this setting in larger cluster will likely start a large number of scans in the cluster. This could block all available compute resource in your cluster and seriously affect your applications availability.

```bash
# *disable* AutoDiscovery for service "juice-shop"
kubectl -n juice-shop annotate service juice-shop auto-discovery.securecodebox.io/ignore=true
```

### Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| config.apiVersion | string | `"config.securecodebox.io/v1"` |  |
| config.cluster.name | string | `"docker-desktop"` |  |
| config.kind | string | `"AutoDiscoveryConfig"` |  |
| config.leaderElection.leaderElect | bool | `true` |  |
| config.leaderElection.resourceName | string | `"80807133.tutorial.kubebuilder.io"` |  |
| config.metrics.bindAddress | string | `"127.0.0.1:8081"` |  |
| config.resourceInclusion.mode | string | `"enable-per-namespace"` |  |
| config.serviceAutoDiscovery.passiveReconcileInterval | string | `"1m"` | interval in which every service is re-checked for updated pods, if service object is updated directly this the service will get reconciled immediately |
| config.serviceAutoDiscovery.scanConfig.annotations | object | `{"defectdojo.securecodebox.io/engagement-name":"{{ .Target.Name }}","defectdojo.securecodebox.io/engagement-version":"{{if (index .Target.Labels `app.kubernetes.io/version`) }}{{ index .Target.Labels `app.kubernetes.io/version` }}{{end}}","defectdojo.securecodebox.io/product-name":"{{ .Cluster.Name }} | {{ .Namespace.Name }} | {{ .Target.Name }}","defectdojo.securecodebox.io/product-tags":"cluster/{{ .Cluster.Name }},namespace/{{ .Namespace.Name }}"}` | annotations to be added to the scans started by the auto-discovery |
| config.serviceAutoDiscovery.scanConfig.labels | object | `{}` | labels to be added to the scans started by the auto-discovery |
| config.serviceAutoDiscovery.scanConfig.parameters | list | `["-t","{{ .Host.Type }}://{{ .Service.Name }}.{{ .Service.Namespace }}.svc:{{ .Host.Port }}"]` | parameters used for the scans created by the serviceAutoDiscovery |
| config.serviceAutoDiscovery.scanConfig.repeatInterval | string | `"168h"` | interval in which scans are automatically repeated. If the target is updated (meaning a new image revision is deployed) the scan will repeated beforehand and the interval is reset. |
| config.serviceAutoDiscovery.scanConfig.scanType | string | `"zap-advanced-scan"` | scanType used for the scans created by the serviceAutoDiscovery |
| image.pullPolicy | string | `"Always"` |  |
| image.repository | string | `"eu.gcr.io/scb-production-7b847126/auto-discovery"` |  |
| image.tag | string | `"latest"` |  |

## Development

### Run the auto-discovery locally

To avoid having to build & deploy the auto-discovery every time you make a code change you can run it locally.
It automatically connects to your current cluster configured in your kube config.

```bash
make run
```

### Running the tests

```bash
# execute the tests locally
make test

# view the test coverage
go tool cover -html=cover.out
```
