<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->
<!--
.: IMPORTANT! :.
--------------------------
This file is generated automatically with `helm-docs` based on the following template files:
- ./.helm-docs/templates.gotmpl (general template data for all charts)
- ./chart-folder/.helm-docs.gotmpl (chart specific template data)

Please be aware of that and apply your changes only within those template files instead of this file.
Otherwise your changes will be reverted/overwritten automatically due to the build process `./.github/workflows/helm-docs.yaml`
--------------------------
-->

<p align="center">
  <a href="https://opensource.org/licenses/Apache-2.0"><img alt="License Apache-2.0" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/releases/latest"><img alt="GitHub release (latest SemVer)" src="https://img.shields.io/github/v/release/secureCodeBox/secureCodeBox?sort=semver"/></a>
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Incubator Project" src="https://img.shields.io/badge/OWASP-Incubator%20Project-365EAA"/></a>
  <a href="https://artifacthub.io/packages/search?repo=securecodebox"><img alt="Artifact HUB" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/securecodebox"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/secureCodeBox/secureCodeBox?logo=GitHub"/></a>
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"/></a>
</p>

## What is OWASP secureCodeBox?

<p align="center">
  <img alt="secureCodeBox Logo" src="https://docs.securecodebox.io/img/Logo_Color.svg" width="250px"/>
</p>

_[OWASP secureCodeBox][scb-github]_ is an automated and scalable open source solution that can be used to integrate various *security vulnerability scanners* with a simple and lightweight interface. The _secureCodeBox_ mission is to support *DevSecOps* Teams to make it easy to automate security vulnerability testing in different scenarios.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The secureCodeBox project is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. It is also possible to start the different integrated security vulnerability scanners based on a docker infrastructure.

### Quickstart with secureCodeBox on kubernetes

You can find resources to help you get started on our [documentation website](https://docs.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://docs.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://docs.securecodebox.io/docs/getting-started/first-scans) with it.

## Example

<p align="center">
  <img width="950" src="./auto-discovery-demo.svg" alt="AutoDiscovery CLI Example">
</p>

This example deploys [JuiceShop](https://owasp.org/www-project-juice-shop/) to a new Kubernetes Namespace.
(You can find the kubernetes manifests for the deployment [here](./demo/juice-shop.yaml))

The AutoDiscovery will automatically pick up this new deployment and then starts a OWASP ZAP Scan against it.
The scan created uses our `zap-advanced` ScanType by default, this can be changed with the `config.serviceAutoDiscovery.scanConfig.scanType` config on the autoDiscovery helm release.

When the ContainerAutoDiscovery is enabled, the AutoDiscovery can also create a trivy scan for each unique container image (having multiple pods with the same container will only create one scan). The scan type can be defined with `config.containerAutoDiscovery.scanConfig.scanType`.

## Deployment
The auto-discovery-kubernetes chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install auto-discovery-kubernetes secureCodeBox/auto-discovery-kubernetes
```

## Requirements

Kubernetes: `>=v1.11.0-0`

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

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| config.apiVersion | string | `"config.securecodebox.io/v1"` |  |
| config.cluster.name | string | `"docker-desktop"` |  |
| config.containerAutoDiscovery.enabled | bool | `false` |  |
| config.containerAutoDiscovery.scanConfig.annotations | object | `{}` | annotations to be added to the scans started by the auto-discovery, all annotation values support templating |
| config.containerAutoDiscovery.scanConfig.labels | object | `{}` | labels to be added to the scans started by the auto-discovery, all label values support templating |
| config.containerAutoDiscovery.scanConfig.parameters | list | `["{{ .ImageID }}"]` | parameters used for the scans created by the containerAutoDiscovery, all parameters support templating |
| config.containerAutoDiscovery.scanConfig.repeatInterval | string | `"168h"` | interval in which scans are automatically repeated. If the target is updated (meaning a new image revision is deployed) the scan will repeated beforehand and the interval is reset. |
| config.containerAutoDiscovery.scanConfig.scanType | string | `"trivy-image"` |  |
| config.containerAutoDiscovery.scanConfig.volumeMounts | list | `[]` | volumeMounts to add to the scan job, see: https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#volumes-1 the fields: `name`, `mountPath`, `subPath`, `subPathExpr` of each volumeMount support templating |
| config.containerAutoDiscovery.scanConfig.volumes | list | `[]` | volumes to add to the scan job, see: https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#volumes the fields: `name`, `secret.secretName`, `configMap.name` of each volume support templating |
| config.health.healthProbeBindAddress | string | `":8081"` |  |
| config.kind | string | `"AutoDiscoveryConfig"` |  |
| config.leaderElection.leaderElect | bool | `true` |  |
| config.leaderElection.resourceName | string | `"0e41a1f4.securecodebox.io"` |  |
| config.metrics.bindAddress | string | `"127.0.0.1:8080"` |  |
| config.resourceInclusion.mode | string | `"enabled-per-namespace"` |  |
| config.serviceAutoDiscovery.enabled | bool | `true` |  |
| config.serviceAutoDiscovery.passiveReconcileInterval | string | `"1m"` | interval in which every service is re-checked for updated pods, if service object is updated directly this the service will get reconciled immediately |
| config.serviceAutoDiscovery.scanConfig.annotations | object | `{"defectdojo.securecodebox.io/engagement-name":"{{ .Target.Name }}","defectdojo.securecodebox.io/engagement-version":"{{if (index .Target.Labels `app.kubernetes.io/version`) }}{{ index .Target.Labels `app.kubernetes.io/version` }}{{end}}","defectdojo.securecodebox.io/product-name":"{{ .Cluster.Name }} | {{ .Namespace.Name }} | {{ .Target.Name }}","defectdojo.securecodebox.io/product-tags":"cluster/{{ .Cluster.Name }},namespace/{{ .Namespace.Name }}"}` | annotations to be added to the scans started by the auto-discovery, all annotation values support templating |
| config.serviceAutoDiscovery.scanConfig.labels | object | `{}` | labels to be added to the scans started by the auto-discovery, all label values support templating |
| config.serviceAutoDiscovery.scanConfig.parameters | list | `["-t","{{ .Host.Type }}://{{ .Service.Name }}.{{ .Service.Namespace }}.svc:{{ .Host.Port }}"]` | parameters used for the scans created by the serviceAutoDiscovery, all parameters support templating |
| config.serviceAutoDiscovery.scanConfig.repeatInterval | string | `"168h"` | interval in which scans are automatically repeated. If the target is updated (meaning a new image revision is deployed) the scan will repeated beforehand and the interval is reset. |
| config.serviceAutoDiscovery.scanConfig.scanType | string | `"zap-advanced-scan"` | scanType used for the scans created by the serviceAutoDiscovery |
| config.serviceAutoDiscovery.scanConfig.volumeMounts | list | `[]` | volumeMounts to add to the scan job, see: https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#volumes-1 the fields: `name`, `mountPath`, `subPath`, `subPathExpr` of each volumeMount support templating |
| config.serviceAutoDiscovery.scanConfig.volumes | list | `[]` | volumes to add to the scan job, see: https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#volumes the fields: `name`, `secret.secretName`, `configMap.name` of each volume support templating |
| image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| image.repository | string | `"securecodebox/auto-discovery-kubernetes"` |  |
| image.tag | string | `nil` |  |
| podSecurityContext | object | `{}` | Sets the securityContext on the operators pod level. See: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-container |
| resources | object | `{"limits":{"cpu":"100m","memory":"100Mi"},"requests":{"cpu":"100m","memory":"20Mi"}}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":true,"runAsNonRoot":true}` | Sets the securityContext on the operators container level. See: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-pod |
| securityContext.allowPrivilegeEscalation | bool | `false` | Ensure that users privileges cannot be escalated |
| securityContext.capabilities.drop[0] | string | `"all"` | This drops all linux privileges from the operator container. They are not required |
| securityContext.privileged | bool | `false` | Ensures that the operator container is not run in privileged mode |
| securityContext.readOnlyRootFilesystem | bool | `true` | Prevents write access to the containers file system |
| securityContext.runAsNonRoot | bool | `true` | Enforces that the Operator image is run as a non root user |

## Contributing

Contributions are welcome and extremely helpful 🙌
Please have a look at [Contributing](./CONTRIBUTING.md)

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [Slack][scb-slack]
- [Twitter][scb-twitter]

secureCodeBox is an official [OWASP][scb-owasp] project.

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://docs.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
## Development

### Run the AutoDiscovery locally

To avoid having to build & deploy the AutoDiscovery every time you make a code change you can run it locally.
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
