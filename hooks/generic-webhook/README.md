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
| hook.image.repository | string | `"docker.io/securecodebox/hook-generic-webhook"` | Hook image repository |
| hook.image.tag | string | defaults to the charts version | The image Tag defaults to the charts version if not defined. |
| hook.ttlSecondsAfterFinished | string | `nil` | Seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| webhookUrl | string | `"http://example.com"` | The URL of your WebHook endpoint |
