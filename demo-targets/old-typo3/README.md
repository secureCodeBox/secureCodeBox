---
title: "Old Typo3"
category: "target"
type: "Website"
state: "released"
appVersion: "v9.4"
usecase: "Modern insecure web application"
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

## What is Old Typo3?

Insecure & Outdated Typo3 Instance: Never expose it to the internet!

### Source Code

* <https://github.com/secureCodeBox/secureCodeBox/tree/master/demo-targets/old-typo3>

## Deployment
The old-typo3 chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install old-typo3 secureCodeBox/old-typo3
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
            <td>affinity</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>annotations</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>add annotations to the deployment, service and pods</td>
        </tr>
        <tr>
            <td>fullnameOverride</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `""`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>image.pullPolicy</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"IfNotPresent"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>image.repository</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"docker.io/securecodebox/demo-target-old-typo3"`
</pre></td>
            <td>Container Image</td>
        </tr>
        <tr>
            <td>image.tag</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    defaults to the appVersion
</pre></td>
            <td>The image tag</td>
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
            <td>ingress.annotations</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>ingress.enabled</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>ingress.hosts[0].host</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"chart-example.local"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>ingress.hosts[0].paths</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>ingress.tls</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>labels</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>add labels to the deployment, service and pods</td>
        </tr>
        <tr>
            <td>nameOverride</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `""`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>nodeSelector</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>podSecurityContext</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>replicaCount</td>
            <td>int</td>
            <td class="default-column">
<pre lang="yaml">

    `1`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>resources</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>securityContext</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>service.port</td>
            <td>int</td>
            <td class="default-column">
<pre lang="yaml">

    `80`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>service.type</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"ClusterIP"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>tolerations</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td></td>
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

