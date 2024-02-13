---
title: "Trivy"
category: "scanner"
type: "Container"
state: "released"
appVersion: "0.49.1"
usecase: "Container Vulnerability Scanner"
---

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
  <a href="https://infosec.exchange/@secureCodeBox"><img alt="Mastodon Follower" src="https://img.shields.io/mastodon/follow/111902499714281911?domain=https%3A%2F%2Finfosec.exchange%2F"/></a>
</p>

## What is Trivy?

`Trivy` (`tri` pronounced like **tri**gger, `vy` pronounced like en**vy**) is a simple and comprehensive vulnerability scanner for containers and other artifacts.
A software vulnerability is a glitch, flaw, or weakness present in the software or in an Operating System.
`Trivy` detects vulnerabilities of OS packages (Alpine, RHEL, CentOS, etc.) and application dependencies (Bundler, Composer, npm, yarn, etc.).
`Trivy` is easy to use. Just install the binary, and you're ready to scan. All you need to do for scanning is to specify a target such as an image name of the container.

To learn more about the Trivy scanner itself visit [Trivy's GitHub Repository](https://github.com/aquasecurity/trivy).

## Deployment
The trivy chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install trivy secureCodeBox/trivy
```

## Scanner Configuration

The following security scan configuration example are based on the [Trivy Documentation](https://aquasecurity.github.io/trivy/), please take a look at the original documentation for more configuration examples.

### Trivy Container Image Scan

Currently we support the follwing 4 scanTypes, corresponding to the trivy scanning modes:
- scanType: "trivy-image"
   - parameters: `[YOUR_IMAGE_NAME]`
- scanType: "trivy-filesystem"
   - parameters: `[YOUR_PATH_TO_FILES]`
- scanType: "trivy-repo"
   - parameters: `[YOUR_GITHUB_REPO]`
- scanType: "trivy-k8s"
   - parameters: `[KUBERNETES_RESOURCE]`

A complete example of each scanType are listed below in our [example docs section](https://www.securecodebox.io/docs/scanners/trivy/#examples).

Simply specify an image name (and a tag) when you use the scanType `trivy-image`. But there are also some additional configuration options e.g:
- Filter the vulnerabilities by severities `--severity HIGH,CRITICAL ruby:2.4.0`
- Filter the vulnerabilities by type (`os` or `library`) `--vuln-type os ruby:2.4.0`
- Skip update of vulnerability DB: `--skip-update python:3.4-alpine3.9`
- Ignore unfixed vulnerabilities:`--ignore-unfixed ruby:2.4.0` By default, Trivy also detects unpatched/unfixed vulnerabilities. This means you can't fix these vulnerabilities even if you update all packages. If you would like to ignore them, use the `--ignore-unfixed` option.

A complete scan definition for the secureCodeBox repository may look something like this:
```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "trivy-scb"
spec:
  scanType: "trivy-image"
  parameters:
    - bkimminich/juice-shop:v10.2.0
```

### Scanning Many Targets
By default, the docker container of trivy will download the vulnerability database when starting the process.
As this download is performed directly from GitHub, you will run into API rate limiting issues after roughly 50 requests.
Trivy [supports a client-server mode](https://aquasecurity.github.io/trivy/latest/docs/references/modes/client-server/) where one process downloads a copy of the vulnerability database and provides it to the others.

This mode is implemented and active by default.
A separate Deployment for the trivy server will be created during the installation and the trivy scanTypes are automatically configured to run in client mode and connect to the server.

:::caution

Client/server mode is not used for `trivy-k8s` scans, because trivy does not support it for this type of scan.
If you start many `trivy-k8s` scans you might run into rate limits.
One way to avoid that is to [preemptively download](https://aquasecurity.github.io/trivy/latest/docs/advanced/air-gap/) the trivy database once and then provide it similar to how the [nuclei template cache](https://www.securecodebox.io/docs/scanners/nuclei/#install-nuclei-without-template-cache-cronjob--persistentvolume) is handled.
:::

In case only a single scan or very few are run, and you want to avoid the small performance overhead, client/server mode can be disabled by setting `--set="trivyDatabaseCache.enabled=false"` during helm install.

## Requirements

Kubernetes: `>=v1.11.0-0`

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascadingRules.enabled | bool | `false` | Enables or disables the installation of the default cascading rules for this scanner |
| createAutoDiscoveryScanType | bool | `false` | Creates a `trivy-image-autodiscovery` scanType with its own ServiceAccount for the SCB AutoDiscovery, enabled to scan images from both public & private registries. |
| imagePullSecrets | list | `[]` | Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/) |
| kubeauditScope | string | `"cluster"` | Automatically sets up rbac roles for kubeaudit to access the resources it scans. Can be either "cluster" (ClusterRole) or "namespace" (Role) |
| parser.affinity | object | `{}` | Optional affinity settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| parser.env | list | `[]` | Optional environment variables mapped into each parseJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| parser.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| parser.image.repository | string | `"docker.io/securecodebox/parser-trivy"` | Parser image repository |
| parser.image.tag | string | defaults to the charts version | Parser image tag |
| parser.nodeSelector | object | `{}` | Optional nodeSelector settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes/) |
| parser.resources | object | `{ requests: { cpu: "200m", memory: "100Mi" }, limits: { cpu: "400m", memory: "200Mi" } }` | Optional resources lets you control resource limits and requests for the parser container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ |
| parser.scopeLimiterAliases | object | `{}` | Optional finding aliases to be used in the scopeLimiter. |
| parser.tolerations | list | `[]` | Optional tolerations settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| parser.ttlSecondsAfterFinished | string | `nil` | seconds after which the Kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| scanner.activeDeadlineSeconds | string | `nil` | There are situations where you want to fail a scan Job after some amount of time. To do so, set activeDeadlineSeconds to define an active deadline (in seconds) when considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-termination-and-cleanup) |
| scanner.affinity | object | `{}` | Optional affinity settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| scanner.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scanner.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scanner.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scanner.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| scanner.image.repository | string | `"docker.io/aquasec/trivy"` | Container Image to run the scan |
| scanner.image.tag | string | `nil` | defaults to the charts appVersion |
| scanner.nameAppend | string | `nil` | append a string to the default scantype name. |
| scanner.nodeSelector | object | `{}` | Optional nodeSelector settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes/) |
| scanner.podSecurityContext | object | `{}` | Optional securityContext set on scanner pod (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":false,"runAsNonRoot":false}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.securityContext.allowPrivilegeEscalation | bool | `false` | Ensure that users privileges cannot be escalated |
| scanner.securityContext.capabilities.drop[0] | string | `"all"` | This drops all linux privileges from the container. |
| scanner.securityContext.privileged | bool | `false` | Ensures that the scanner container is not run in privileged mode |
| scanner.securityContext.readOnlyRootFilesystem | bool | `false` | Prevents write access to the containers file system |
| scanner.securityContext.runAsNonRoot | bool | `false` | Enforces that the scanner image is run as a non root user |
| scanner.suspend | bool | `false` | if set to true the scan job will be suspended after creation. You can then resume the job using `kubectl resume <jobname>` or using a job scheduler like kueue |
| scanner.tolerations | list | `[]` | Optional tolerations settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| scanner.ttlSecondsAfterFinished | string | `nil` | seconds after which the Kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| trivyDatabaseCache.enabled | bool | `true` | Enables or disables the use of trivy server in another pod to cache the vulnerability database for all scans. |
| trivyDatabaseCache.replicas | int | `1` | amount of replicas to configure for the Deployment |

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]:    https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]:     https://www.securecodebox.io/
[scb-site]:     https://www.securecodebox.io/
[scb-github]:   https://github.com/secureCodeBox/
[scb-mastodon]: https://infosec.exchange/@secureCodeBox
[scb-slack]:    https://owasp.org/slack/invite
[scb-license]:  https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE

