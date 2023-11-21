---
title: "secreCodeBox AutoDiscovery for Kubernetes"
category: "core"
type: "AutoDiscovery"
state: "released"
appVersion: ""
usecase: "secureCodeBox AutoDiscovery for Kubernetes discovers and starts scans for apps running in the cluster."
---

![auto-discovery logo](https://www.securecodebox.io/img/Logo_Color.svg)

The secureCodeBox _AutoDiscovery_ is running on kubernetes (K8S) and is an optional component of the complete secureCodeBox stack.
The Kubernetes AutoDiscovery needs to be deployed along side the secureCodeBox Operator. It monitors security relevant resources inside a K8S environment and automatically create scans to continuously monitor security aspects of the resources.

<!-- end -->

The AutoDiscovery controller will automatically detect these new resources (services and containers) and start secureCodeBox _scans_ for them:

1. A ZAP Baseline Scan to detect basic web vulnerabilities in the service. (Using OWASP ZAP)
2. An image scan scanning for vulnerable libraries in the docker / container image of the deployment. (Using trivy)
3. (WIP) A TLS Scan against the certificate of the ingress for the host. (Using SSLyze)

The AutoDiscovery automatically tracks the lifecycle of the kubernetes resources and will automatically start new scans for new application versions.

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
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Lab Project" src="https://img.shields.io/badge/OWASP-Lab%20Project-yellow"/></a>
  <a href="https://artifacthub.io/packages/search?repo=securecodebox"><img alt="Artifact HUB" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/securecodebox"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/secureCodeBox/secureCodeBox?logo=GitHub"/></a>
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"/></a>
</p>

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
3. `all`: [See section](#all-mode)

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

#### All Mode

Enable this by setting `config.resourceInclusion.mode=all`.

This mode will start scans for **every** resources in the cluster **unless** it has the annotation `auto-discovery.securecodebox.io/ignore=true`.

> ⚠️ Using this setting in larger cluster will likely start a large number of scans in the cluster. This could block all available compute resource in your cluster and seriously affect your applications availability.

```bash
# *disable* AutoDiscovery for service "juice-shop"
kubectl -n juice-shop annotate service juice-shop auto-discovery.securecodebox.io/ignore=true
```

<table>
    <thead>
        <th>Key</th>
        <th>Type</th>
        <th class="default-column">Default</th>
        <th>Description</th>
    </thead>
    <tbody>
        <tr>
            <td>config.apiVersion</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"config.securecodebox.io/v1"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>config.cluster.name</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"docker-desktop"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>config.containerAutoDiscovery.enabled</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>config.containerAutoDiscovery.passiveReconcileInterval</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"1m"`
</pre></td>
            <td>interval in which every pod is re-checked for updates, currently used to periodically check if the configured scantype is installed in the namespace of the pod</td>
        </tr>
        <tr>
            <td>config.containerAutoDiscovery.scanConfigs[0].annotations</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"defectdojo.securecodebox.io/engagement-name":"{{ .Target.Name }}","defectdojo.securecodebox.io/engagement-version":"{{if (index .Target.Labels `app.kubernetes.io/version`) }}{{ index .Target.Labels `app.kubernetes.io/version` }}{{end}}","defectdojo.securecodebox.io/product-name":"{{ .Cluster.Name }} | {{ .Namespace.Name }} | {{ .Target.Name }}","defectdojo.securecodebox.io/product-tags":"cluster/{{ .Cluster.Name }},namespace/{{ .Namespace.Name }}"}`
</pre></td>
            <td>annotations to be added to the scans started by the auto-discovery, all annotation values support templating</td>
        </tr>
        <tr>
            <td>config.containerAutoDiscovery.scanConfigs[0].hookSelector</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>hookSelector allows to specify a LabelSelector with which the hooks are selected, see: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors Both matchLabels and matchExpressions are supported. All values in the matchLabels map support templating. MatchExpressions support templating in the `key` field and in every entry in the `values` list. If a value in the list renders to an empty string it is removed from the list.</td>
        </tr>
        <tr>
            <td>config.containerAutoDiscovery.scanConfigs[0].labels</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>labels to be added to the scans started by the auto-discovery, all label values support templating</td>
        </tr>
        <tr>
            <td>config.containerAutoDiscovery.scanConfigs[0].name</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"trivy"`
</pre></td>
            <td>unique name to distinguish scans</td>
        </tr>
        <tr>
            <td>config.containerAutoDiscovery.scanConfigs[0].parameters</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `["{{ .ImageID }}"]`
</pre></td>
            <td>parameters used for the scans created by the containerAutoDiscovery, all parameters support templating</td>
        </tr>
        <tr>
            <td>config.containerAutoDiscovery.scanConfigs[0].repeatInterval</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"168h"`
</pre></td>
            <td>interval in which scans are automatically repeated. If the target is updated (meaning a new image revision is deployed) the scan will repeated beforehand and the interval is reset.</td>
        </tr>
        <tr>
            <td>config.containerAutoDiscovery.scanConfigs[0].scanType</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"trivy-image-autodiscovery"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>config.containerAutoDiscovery.scanConfigs[0].volumeMounts</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>volumeMounts to add to the scan job, see: https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#volumes-1 the fields: `name`, `mountPath`, `subPath`, `subPathExpr` of each volumeMount support templating</td>
        </tr>
        <tr>
            <td>config.containerAutoDiscovery.scanConfigs[0].volumes</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>volumes to add to the scan job, see: https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#volumes the fields: `name`, `secret.secretName`, `configMap.name` of each volume support templating</td>
        </tr>
        <tr>
            <td>config.health.healthProbeBindAddress</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `":8081"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>config.imagePullSecretConfig.mapImagePullSecretsToEnvironmentVariables</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>config.imagePullSecretConfig.passwordEnvironmentVariableName</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"TRIVY_PASSWORD"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>config.imagePullSecretConfig.usernameEnvironmentVariableName</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"TRIVY_USERNAME"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>config.kind</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"AutoDiscoveryConfig"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>config.leaderElection.leaderElect</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>config.leaderElection.resourceName</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"0e41a1f4.securecodebox.io"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>config.metrics.bindAddress</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"127.0.0.1:8080"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>config.resourceInclusion.mode</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"enabled-per-namespace"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>config.serviceAutoDiscovery.enabled</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>config.serviceAutoDiscovery.passiveReconcileInterval</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"1m"`
</pre></td>
            <td>interval in which every service is re-checked for updated pods, if service object is updated directly this the service will get reconciled immediately</td>
        </tr>
        <tr>
            <td>config.serviceAutoDiscovery.scanConfigs[0]</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"annotations":{"defectdojo.securecodebox.io/engagement-name":"{{ .Target.Name }}","defectdojo.securecodebox.io/engagement-version":"{{if (index .Target.Labels `app.kubernetes.io/version`) }}{{ index .Target.Labels `app.kubernetes.io/version` }}{{end}}","defectdojo.securecodebox.io/product-name":"{{ .Cluster.Name }} | {{ .Namespace.Name }} | {{ .Target.Name }}","defectdojo.securecodebox.io/product-tags":"cluster/{{ .Cluster.Name }},namespace/{{ .Namespace.Name }}"},"hookSelector":{},"labels":{},"name":"zap","parameters":["-t","{{ .Host.Type }}://{{ .Service.Name }}.{{ .Service.Namespace }}.svc:{{ .Host.Port }}"],"repeatInterval":"168h","scanType":"zap-advanced-scan","volumeMounts":[],"volumes":[]}`
</pre></td>
            <td>scanType used for the scans created by the serviceAutoDiscovery</td>
        </tr>
        <tr>
            <td>config.serviceAutoDiscovery.scanConfigs[0].annotations</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"defectdojo.securecodebox.io/engagement-name":"{{ .Target.Name }}","defectdojo.securecodebox.io/engagement-version":"{{if (index .Target.Labels `app.kubernetes.io/version`) }}{{ index .Target.Labels `app.kubernetes.io/version` }}{{end}}","defectdojo.securecodebox.io/product-name":"{{ .Cluster.Name }} | {{ .Namespace.Name }} | {{ .Target.Name }}","defectdojo.securecodebox.io/product-tags":"cluster/{{ .Cluster.Name }},namespace/{{ .Namespace.Name }}"}`
</pre></td>
            <td>annotations to be added to the scans started by the auto-discovery, all annotation values support templating</td>
        </tr>
        <tr>
            <td>config.serviceAutoDiscovery.scanConfigs[0].hookSelector</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>HookSelector allows to specify a LabelSelector with which the hooks are selected, see: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors Both matchLabels and matchExpressions are supported. All values in the matchLabels map support templating. MatchExpressions support templating in the `key` field and in every entry in the `values` list. If a value in the list renders to an empty string it is removed from the list.</td>
        </tr>
        <tr>
            <td>config.serviceAutoDiscovery.scanConfigs[0].labels</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>labels to be added to the scans started by the auto-discovery, all label values support templating</td>
        </tr>
        <tr>
            <td>config.serviceAutoDiscovery.scanConfigs[0].name</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"zap"`
</pre></td>
            <td>unique name to distinguish scans</td>
        </tr>
        <tr>
            <td>config.serviceAutoDiscovery.scanConfigs[0].parameters</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `["-t","{{ .Host.Type }}://{{ .Service.Name }}.{{ .Service.Namespace }}.svc:{{ .Host.Port }}"]`
</pre></td>
            <td>parameters used for the scans created by the serviceAutoDiscovery, all parameters support templating</td>
        </tr>
        <tr>
            <td>config.serviceAutoDiscovery.scanConfigs[0].repeatInterval</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"168h"`
</pre></td>
            <td>interval in which scans are automatically repeated. If the target is updated (meaning a new image revision is deployed) the scan will repeated beforehand and the interval is reset.</td>
        </tr>
        <tr>
            <td>config.serviceAutoDiscovery.scanConfigs[0].volumeMounts</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>volumeMounts to add to the scan job, see: https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#volumes-1 the fields: `name`, `mountPath`, `subPath`, `subPathExpr` of each volumeMount support templating</td>
        </tr>
        <tr>
            <td>config.serviceAutoDiscovery.scanConfigs[0].volumes</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>volumes to add to the scan job, see: https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#volumes the fields: `name`, `secret.secretName`, `configMap.name` of each volume support templating</td>
        </tr>
        <tr>
            <td>image.pullPolicy</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"IfNotPresent"`
</pre></td>
            <td>Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images</td>
        </tr>
        <tr>
            <td>image.repository</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"securecodebox/auto-discovery-kubernetes"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>image.tag</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>imagePullSecrets</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/)</td>
        </tr>
        <tr>
            <td>podSecurityContext</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Sets the securityContext on the operators pod level. See: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-container</td>
        </tr>
        <tr>
            <td>resources</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"limits":{"cpu":"100m","memory":"100Mi"},"requests":{"cpu":"100m","memory":"20Mi"}}`
</pre></td>
            <td>CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/)</td>
        </tr>
        <tr>
            <td>securityContext</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":true,"runAsNonRoot":true}`
</pre></td>
            <td>Sets the securityContext on the operators container level. See: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-pod</td>
        </tr>
        <tr>
            <td>securityContext.allowPrivilegeEscalation</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Ensure that users privileges cannot be escalated</td>
        </tr>
        <tr>
            <td>securityContext.capabilities.drop[0]</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"all"`
</pre></td>
            <td>This drops all linux privileges from the operator container. They are not required</td>
        </tr>
        <tr>
            <td>securityContext.privileged</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Ensures that the operator container is not run in privileged mode</td>
        </tr>
        <tr>
            <td>securityContext.readOnlyRootFilesystem</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>Prevents write access to the containers file system</td>
        </tr>
        <tr>
            <td>securityContext.runAsNonRoot</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>Enforces that the Operator image is run as a non root user</td>
        </tr>
    </tbody>
</table>

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://www.securecodebox.io/
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
