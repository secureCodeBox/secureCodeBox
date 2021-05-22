
---
title: "Update Field"
category: "hook"
type: "dataProcessing"
state: "released"
usecase: "Updates fields in finding results."
---

<!-- end -->

## Deployment

Installing the _Update Field_ hook will add a ReadAndWrite Hook to your namespace, which can be used to add or update fields from your findings.

```bash
helm upgrade --install ufh secureCodeBox/update-field --set attribute.name="category" --set attribute.value="my-own-category"
```

> ✍ This documentation is currently work-in-progress.

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| attribute.name | string | `"category"` | The name of the attribute you want to add to each finding result |
| attribute.value | string | `"my-own-category"` | The value of the attribute you want to add to each finding result |
| hookJob.ttlSecondsAfterFinished | string | `nil` | Seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| image.repository | string | `"docker.io/securecodebox/update-field"` | Hook image repository |
| image.tag | string | defaults to the charts version | The image Tag defaults to the charts version if not defined. |
