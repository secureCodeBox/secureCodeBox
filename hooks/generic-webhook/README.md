---
title: "Generic WebHook"
category: "hook"
type: "integration"
state: "released"
usecase: "Publishes Scan Findings as WebHook."
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

## What is "Generic WebHook" Hook about?
Installing the Generic WebHook hook will add a ReadOnly Hook to your namespace which is capable of sending scan results containing `findings` to a given webhook url.

## Deployment
The generic-webhook chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install generic-webhook secureCodeBox/generic-webhook
```

## Requirements

Kubernetes: `>=v1.11.0-0`

## Additional Chart Configurations
The webhook URL is set as follows:

```bash
helm upgrade --install generic-webhook secureCodeBox/generic-webhook \
    --set="webhookUrl=http://http-webhook/hello-world"
```
Two authentication methods exist for the Generic WebHook Hook. You can either use  Basic authentication or API authentication.
The authentication method is set by creating the corresponding secret as follows:

##### Basic authentication:
   
```bash
kubectl create secret generic generic-webhook-credentials \
--from-literal=username='admin' \
--from-literal=password='ThisIsAPassword'
```
##### API authentication:

```bash
kubectl create secret generic generic-webhook-credentials \
--from-literal=headerName='X-Example-Header' \
--from-literal=headerValue='ThisIsAnAPIkeyValue'
```

Only one authentication method can be used at a time.

The keys for your secret mapping can also be renamed if necessary, for example `headerName` and `headerValue` can be renamed to `name` and `value` respectively.

This is usually done to reuse existing secrets.
```bash
helm upgrade --install generic-webhook secureCodeBox/generic-webhook \
--set="hook.authentication.apikey.headerNameKey=name"  \
--set="hook.authentication.apikey.headerValueKey=value"
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
            <td>hook.affinity</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Optional affinity settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/)</td>
        </tr>
        <tr>
            <td>hook.authentication</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"apikey":{"headerNameKey":"headerName","headerValueKey":"headerValue","userSecret":"generic-webhook-credentials"},"basic":{"passwordKey":"password","userSecret":"generic-webhook-credentials","usernameKey":"username"}}`
</pre></td>
            <td>Optional basic authentication credentials or apikey</td>
        </tr>
        <tr>
            <td>hook.authentication.apikey.headerNameKey</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"headerName"`
</pre></td>
            <td>Name of the header name key in the `userSecret` secret. Use this if you already have a secret with different key / value pairs</td>
        </tr>
        <tr>
            <td>hook.authentication.apikey.headerValueKey</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"headerValue"`
</pre></td>
            <td>Name of the header value key in the `userSecret` secret. Use this if you already have a secret with different key / value pairs</td>
        </tr>
        <tr>
            <td>hook.authentication.apikey.userSecret</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"generic-webhook-credentials"`
</pre></td>
            <td>Link a pre-existing generic secret with `headerNameKey` and `headerValueKey` key / value pairs</td>
        </tr>
        <tr>
            <td>hook.authentication.basic.passwordKey</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"password"`
</pre></td>
            <td>Name of the password key in the `userSecret` secret. Use this if you already have a secret with different key / value pairs</td>
        </tr>
        <tr>
            <td>hook.authentication.basic.userSecret</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"generic-webhook-credentials"`
</pre></td>
            <td>Link a pre-existing generic secret with `usernameKey` and `passwordKey` key / value pairs</td>
        </tr>
        <tr>
            <td>hook.authentication.basic.usernameKey</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"username"`
</pre></td>
            <td>Name of the username key in the `userSecret` secret. Use this if you already have a secret with different key / value pairs</td>
        </tr>
        <tr>
            <td>hook.env</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional environment variables mapped into the hook (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)</td>
        </tr>
        <tr>
            <td>hook.extraVolumeMounts</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional VolumeMounts mapped into the hook (see: https://kubernetes.io/docs/concepts/storage/volumes/)</td>
        </tr>
        <tr>
            <td>hook.extraVolumes</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional Volumes mapped into the hook (see: https://kubernetes.io/docs/concepts/storage/volumes/)</td>
        </tr>
        <tr>
            <td>hook.image.repository</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"docker.io/securecodebox/hook-generic-webhook"`
</pre></td>
            <td>Hook image repository</td>
        </tr>
        <tr>
            <td>hook.image.tag</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    defaults to the charts version
</pre></td>
            <td>The image Tag defaults to the charts version if not defined.</td>
        </tr>
        <tr>
            <td>hook.labels</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Add Kubernetes Labels to the hook definition</td>
        </tr>
        <tr>
            <td>hook.priority</td>
            <td>int</td>
            <td class="default-column">
<pre lang="yaml">

    `0`
</pre></td>
            <td>Hook priority. Higher priority Hooks are guaranteed to execute before low priority Hooks.</td>
        </tr>
        <tr>
            <td>hook.resources</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

   
</pre></td>
            <td>Optional resources lets you control resource limits and requests for the hook container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/</td>
        </tr>
        <tr>
            <td>hook.tolerations</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional tolerations settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)</td>
        </tr>
        <tr>
            <td>hook.ttlSecondsAfterFinished</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>Seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/</td>
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
            <td>webhookUrl</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"http://example.com"`
</pre></td>
            <td>The URL of your WebHook endpoint</td>
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

