---
title: "Cascading Scans"
category: "hook"
type: "processing"
state: "released"
usecase: "Cascading Scans based declarative Rules."
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
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"/></a>
</p>

## What is "Cascading Scans" Hook about?
The Cascading Scans Hook can be used to orchestrate security scanners based on defined rule sets.
The so called `CascadingRules` consist of a `matches` section which contains one or multiple rules which are compared against `findings`. When a `finding` matches a `rule` the `scanSpec` section will then be used to create a new scan. To customize the scan to match the finding, the [mustache](https://github.com/janl/mustache.js) templating language can be used to reference fields of the finding.

This Hook is based on the ADR https://www.securecodebox.io/docs/architecture/adr/adr_0003

More information about how to use cascading scans can be found here:
* Custom Resource Definition: https://www.securecodebox.io/docs/api/crds/cascading-rule/
* How-To Network Scanning: https://www.securecodebox.io/docs/how-tos/scanning-networks/

## Deployment
The cascading-scans chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install cascading-scans secureCodeBox/cascading-scans
```

## Requirements

Kubernetes: `>=v1.11.0-0`

## Additional Chart Configurations
Installing the `Cascading Scans` hook will add a `ReadOnly Hook` to your namespace which looks for matching _CascadingRules_ in the namespace and start the according scans.

### Verification
```bash
kubectl get ScanCompletionHooks
NAME   TYPE       IMAGE
dssh   ReadOnly   docker.io/securecodebox/hook-cascading-scans:latest
```

### CascadingScan Rules
The CascadingRules are included directly in each helm chart of the individual scanners.
There is a configuration option `cascadingRules.enabled` for each scanner to prevent this inclusion.

```bash
# Check your CascadingRules
kubectl get CascadingRules
NAME             STARTS              INVASIVENESS   INTENSIVENESS
https-tls-scan   sslyze              non-invasive   light
imaps-tls-scan   sslyze              non-invasive   light
nikto-http       nikto               non-invasive   medium
nmap-smb         nmap                non-invasive   light
pop3s-tls-scan   sslyze              non-invasive   light
smtps-tls-scan   sslyze              non-invasive   light
ssh-scan         ssh-scan            non-invasive   light
zap-http         zap-baseline-scan   non-invasive   medium
```

### Starting a cascading Scan
When you start a normal Scan, no CascadingRule will be applied. To use a _CascadingRule_ the scan must be marked to allow cascading rules.
This is implemented using kubernetes label selectors, meaning that scans mark the classes of scans which are allowed to be cascaded by the current one.

#### Example
```yaml
cat <<EOF | kubectl apply -f -
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "example.com"
spec:
  scanType: nmap
  parameters:
    - -p22,80,443
    - example.com
  cascades:
    matchLabels:
      securecodebox.io/intensive: light
EOF
```

This Scan will use all CascadingRules which are labeled with a "light" intensity.
You can lookup which CascadingRules this selects by running:

```bash
kubectl get CascadingRules -l "securecodebox.io/intensive=light"
NAME             STARTS     INVASIVENESS   INTENSIVENESS
https-tls-scan   sslyze     non-invasive   light
imaps-tls-scan   sslyze     non-invasive   light
nmap-smb         nmap       non-invasive   light
pop3s-tls-scan   sslyze     non-invasive   light
smtps-tls-scan   sslyze     non-invasive   light
ssh-scan         ssh-scan   non-invasive   light
```

The label selectors also allow the more powerful matchExpressions selectors:

```yaml
cat <<EOF | kubectl apply -f -
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "example.com"
spec:
  scanType: nmap
  parameters:
    - -p22,80,443
    - example.com
  cascades:
    # Using matchExpressions instead of matchLabels
    matchExpressions:
    - key: "securecodebox.io/intensive"
      operator: In
      # This select both light and medium intensity rules
      values: [light, medium]
EOF
```

This selection can be replicated in kubectl using:

```bash
kubectl get CascadingRules -l "securecodebox.io/intensive in (light,medium)"
NAME             STARTS              INVASIVENESS   INTENSIVENESS
https-tls-scan   sslyze              non-invasive   light
imaps-tls-scan   sslyze              non-invasive   light
nikto-http       nikto               non-invasive   medium
nmap-smb         nmap                non-invasive   light
pop3s-tls-scan   sslyze              non-invasive   light
smtps-tls-scan   sslyze              non-invasive   light
ssh-scan         ssh-scan            non-invasive   light
zap-http         zap-baseline-scan   non-invasive   medium
```

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| hook.affinity | object | `{}` | Optional affinity settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| hook.image.repository | string | `"docker.io/securecodebox/hook-cascading-scans"` | Hook image repository |
| hook.image.tag | string | defaults to the charts version | The image Tag defaults to the charts version if not defined. |
| hook.labels | object | `{}` | Add Kubernetes Labels to the hook definition |
| hook.priority | int | `0` | Hook priority. Higher priority Hooks are guaranteed to execute before low priority Hooks. |
| hook.resources | object | { requests: { cpu: "200m", memory: "100Mi" }, limits: { cpu: "400m", memory: "200Mi" } } | Optional resources lets you control resource limits and requests for the hook container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ |
| hook.tolerations | list | `[]` | Optional tolerations settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| hook.ttlSecondsAfterFinished | string | `nil` | Seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| imagePullSecrets | list | `[]` | Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/) |

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

