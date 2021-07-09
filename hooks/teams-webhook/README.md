---
title: "MS Teams WebHook"
category: "hook"
type: "integration"
state: "roadmap"
usecase: "Publishes Scan Summary to MS Teams."
---

<!--
SPDX-FileCopyrightText: 2020 iteratec GmbH

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
  <a href="https://opensource.org/licenses/Apache-2.0"><img alt="License Apache-2.0" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/releases/latest"><img alt="GitHub release (latest SemVer)" src="https://img.shields.io/github/v/release/secureCodeBox/secureCodeBox?sort=semver"></a>
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Incubator Project" src="https://img.shields.io/badge/OWASP-Incubator%20Project-365EAA"></a>
  <a href="https://artifacthub.io/packages/search?repo=seccurecodebox"><img alt="Artifact HUB" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/seccurecodebox"></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/secureCodeBox/secureCodeBox?logo=GitHub"></a>
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"></a>
</p>

## What is "Teams Webhook" Hook about?
> 🔧 This chart is deprecated and will be replaced by the more general `notification-hook` soon

## Deployment
The teams-webhook `scanType` can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install teams-webhook secureCodeBox/teams-webhook
```

## Requirements

Kubernetes: `>=v1.11.0-0`

## Additional Chart Configurations

> ✍ This documentation is currently work-in-progress.

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| hook.image.repository | string | `"docker.io/securecodebox/hook-teams-webhook"` | Hook image repository |
| hook.image.tag | string | defaults to the charts version | Image tag |
| hook.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| notification.rules | list | `[]` | A optional rule definition that can be used to describe in wich case a notification must be fired. If not defined / empty each scan result will be notified. |
| notification.template | string | `"messageCard"` | The MS Teams message template that should be used [messageCard | adaptiveCard]. |
| notification.url | string | `"http://example.com"` | The URL of your WebHook endpoint |
| vulnerabilityManagement.enabled | bool | `false` |  |
| vulnerabilityManagement.findingsUrl | string | `"https://your-kibana-service.url/your-dashboard-path/filter:{{uid}}"` |  |
| vulnerabilityManagement.name | string | `"Kibana Dashboard"` |  |
| vulnerabilityManagement.url | string | `"https://your-kibana-service.url/your-dashboard-path"` |  |

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

