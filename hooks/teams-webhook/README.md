---
title: "MS Teams WebHook"
category: "hook"
type: "integration"
state: "roadmap"
usecase: "Publishes Scan Summary to MS Teams."
---

<!-- end -->

## Deployment

Installing the Teams WebHook hook will add a ReadOnly Hook to your namespace.

> 🔧 The implementation is currently work-in-progress and still undergoing major changes. It'll be released here once it has stabilized.

```bash
helm upgrade --install twh ./hooks/teams-webhook/ --set notification.url="http://example.com/my/webhook/target"
```
> ✍ This documentation is currently work-in-progress.

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| hook.image.repository | string | `"docker.io/securecodebox/teams-webhook"` | Hook image repository |
| hook.image.tag | string | defaults to the charts version | Image tag |
| hook.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| notification.rules | list | `[]` | A optional rule definition that can be used to describe in wich case a notification must be fired. If not defined / empty each scan result will be notified. |
| notification.template | string | `"messageCard"` | The MS Teams message template that should be used [messageCard | adaptiveCard]. |
| notification.url | string | `"http://example.com"` | The URL of your WebHook endpoint |
| vulnerabilityManagement.enabled | bool | `false` |  |
| vulnerabilityManagement.findingsUrl | string | `"https://your-kibana-service.url/your-dashboard-path/filter:{{uid}}"` |  |
| vulnerabilityManagement.name | string | `"Kibana Dashboard"` |  |
| vulnerabilityManagement.url | string | `"https://your-kibana-service.url/your-dashboard-path"` |  |
