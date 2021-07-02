# teams-webhook

> **:exclamation: This Helm Chart is deprecated!**

![Version: v2.7.0-alpha1](https://img.shields.io/badge/Version-v2.7.0--alpha1-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square)

Lets you send a findings result summary as webhook to MS Teams, after a scan is completed.

**Homepage:** <https://docs.securecodebox.io/docs/hooks/ms-teams-webhook>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| iteratec GmbH | secureCodeBox@iteratec.com |  |

## Source Code

* <https://github.com/secureCodeBox/secureCodeBox>

## Requirements

Kubernetes: `>=v1.11.0-0`

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

