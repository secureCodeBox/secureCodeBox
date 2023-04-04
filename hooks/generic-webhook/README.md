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

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| hook.affinity | object | `{}` | Optional affinity settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| hook.authentication | object | `{"apikey":{"headerNameKey":"headerName","headerValueKey":"headerValue","userSecret":"generic-webhook-credentials"},"basic":{"passwordKey":"password","userSecret":"generic-webhook-credentials","usernameKey":"username"}}` | Optional basic authentication credentials or apikey |
| hook.authentication.apikey.headerNameKey | string | `"headerName"` | Name of the header name key in the `userSecret` secret. Use this if you already have a secret with different key / value pairs |
| hook.authentication.apikey.headerValueKey | string | `"headerValue"` | Name of the header value key in the `userSecret` secret. Use this if you already have a secret with different key / value pairs |
| hook.authentication.apikey.userSecret | string | `"generic-webhook-credentials"` | Link a pre-existing generic secret with `headerNameKey` and `headerValueKey` key / value pairs |
| hook.authentication.basic.passwordKey | string | `"password"` | Name of the password key in the `userSecret` secret. Use this if you already have a secret with different key / value pairs |
| hook.authentication.basic.userSecret | string | `"generic-webhook-credentials"` | Link a pre-existing generic secret with `usernameKey` and `passwordKey` key / value pairs |
| hook.authentication.basic.usernameKey | string | `"username"` | Name of the username key in the `userSecret` secret. Use this if you already have a secret with different key / value pairs |
| hook.image.repository | string | `"docker.io/securecodebox/hook-generic-webhook"` | Hook image repository |
| hook.image.tag | string | defaults to the charts version | The image Tag defaults to the charts version if not defined. |
| hook.labels | object | `{}` | Add Kubernetes Labels to the hook definition |
| hook.priority | int | `0` | Hook priority. Higher priority Hooks are guaranteed to execute before low priority Hooks. |
| hook.resources | object | { requests: { cpu: "200m", memory: "100Mi" }, limits: { cpu: "400m", memory: "200Mi" } } | Optional resources lets you control resource limits and requests for the hook container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ |
| hook.tolerations | list | `[]` | Optional tolerations settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| hook.ttlSecondsAfterFinished | string | `nil` | Seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| imagePullSecrets | list | `[]` | Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/) |
| webhookUrl | string | `"http://example.com"` | The URL of your WebHook endpoint |

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

