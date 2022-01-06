---
title: "Azure Monitor"
category: "hook"
type: "persistenceProvider"
state: "released"
usecase: "Publishes all Scan Findings to Azure Monitor."
---

<!--
SPDX-FileCopyrightText: 2021 iteratec GmbH

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

## What is "Persistence Azure Monitor" Hook about?
The Azure Monitor persistenceProvider hook saves all findings and reports into the configured Azure Monitor workspace using the [Data Collector API](https://docs.microsoft.com/en-us/azure/azure-monitor/logs/data-collector-api).
This allows working with the data in [Azure Monitor](https://azure.microsoft.com/en-us/services/monitor/) or [Microsoft Sentinel](https://docs.microsoft.com/en-us/azure/sentinel/overview) to configure alerting based on new findings.
It will create a custom log type for every scantype titled SCB_[scantype_name].

Installing the Azure Monitor persistenceProvider hook will add a _ReadOnly Hook_ to your namespace.

## Deployment
The persistence-azure-monitor chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install persistence-azure-monitor secureCodeBox/persistence-azure-monitor
```

## Requirements

Kubernetes: `>=v1.11.0-0`

## Additional Chart Configurations
The hook requires the Azure Monitor Workspace ID and its Primary Key for authentication. For details on how to find them, see [this page](https://docs.microsoft.com/en-us/azure/azure-monitor/logs/data-collector-api#sample-requests).
Create a Kubernetes secret with these values using

```bash
# Write the secrets to a file without trailing linebreak
# (use leading space to exclude it from the history of your shell)
 echo -n your-workspace-id > workspace
 echo -n your-shared-key > sharedkey
# Create the secret
kubectl create secret generic azure-monitor --from-file=workspace=./workspace --from-file=sharedkey=./sharedkey
# Delete the files again
rm workspace sharedkey
```

Then, configure the hook to use this secret when installing it:
```bash
helm upgrade --install persistence-azure-monitor . --wait \
             --set="monitor.authentication.apiKeySecret="azure-monitor""
```

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| hook.affinity | object | `{}` | Optional affinity settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| hook.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| hook.image.repository | string | `"docker.io/securecodebox/hook-persistence-azure-monitor"` | Hook image repository |
| hook.image.tag | string | `nil` | Container image tag |
| hook.labels | object | `{}` | Add Kubernetes Labels to the hook definition |
| hook.priority | int | `0` | Hook priority. Higher priority Hooks are guaranteed to execute before low priority Hooks. |
| hook.tolerations | list | `[]` | Optional tolerations settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| hook.ttlSecondsAfterFinished | string | `nil` | Seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| monitor.authentication | object | `{"apiKeySecret":null}` | Configure authentication schema and credentials the persistence provider should use to connect to Azure Monitor |
| monitor.authentication.apiKeySecret | string | `nil` | Link a pre-existing generic secret with `workspace` and `sharedkey` key / value pairs |
| monitor.logtypePrefix | string | `"SCB"` |  |

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

