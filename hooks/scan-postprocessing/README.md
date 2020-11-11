---
title: "Scan Postprocessing"
category: "hook"
type: "dataProcessing"
state: "released"
usecase: "Updates fields for findings meeting specified conditions."
---

<!-- end -->

## Deployment

Installing the _Scan Postprocessing hook will add a ReadAndWrite Hook to your namespace, which can be used to add or update fields from your findings meeting specified conditions.

```bash
helm upgrade --install spp secureCodeBox/scan-postprocessing
```

> ✍ This documentation is currently work-in-progress.

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| image.repository | string | `"docker.io/securecodebox/scan-postprocessing"` | Hook image repository |
| image.tag | string | `nil` |  |
| rules[0].matches.anyOf[0].attributes.port | int | `21` |  |
| rules[0].matches.anyOf[0].attributes.state | string | `"open"` |  |
| rules[0].matches.anyOf[0].category | string | `"Open Port"` |  |
| rules[0].matches.anyOf[1].attributes.port | int | `389` |  |
| rules[0].matches.anyOf[1].attributes.state | string | `"open"` |  |
| rules[0].matches.anyOf[1].category | string | `"Open Port"` |  |
| rules[0].override.description | string | `"Telnet is bad"` |  |
| rules[0].override.severity | string | `"high"` |  |
| rules[1].matches.anyOf[0].attributes.port | int | `42` |  |
| rules[1].matches.anyOf[0].attributes.state | string | `"open"` |  |
| rules[1].matches.anyOf[0].category | string | `"Open Port"` |  |
| rules[1].override.description | string | `"False Positive due to VPN weirdness"` |  |
| rules[1].override.falsePositive | bool | `true` |  |
| rules[1].override.severity | string | `"Informational"` |  |
