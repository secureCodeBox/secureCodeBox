---
title: "Generic WebHook"
category: "hook"
type: "integration"
state: "released"
usecase: "Publishes Scan Findings as WebHook."
---

<!-- end -->

## Deployment

Installing the Generic WebHook hook will add a ReadOnly Hook to your namespace.

```bash
helm upgrade --install gwh secureCodeBox/generic-webhook --set webhookUrl="http://example.com/my/webhook/target"
```
> ✍ This documentation is currently work-in-progress.

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| hookJob.ttlSecondsAfterFinished | string | `nil` | Seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| image.repository | string | `"docker.io/securecodebox/generic-webhook"` | Hook image repository |
| image.tag | string | `nil` |  |
| webhookUrl | string | `"http://example.com"` | The URL of your WebHook endpoint |
