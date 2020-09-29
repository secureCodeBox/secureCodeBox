---
title: "Imperative  Scans"
path: "hooks/imperative-subsequent-scans"
category: "hook"
type: "integration"
state: "roadmap"
usecase: "Cascading Scans based imperative Rules."
---

## Deployment

Installing the imperative-subsequent-scans hook will add a ReadOnly Hook to your namespace.

```bash
helm upgrade --install issh ./hooks/imperative-subsequent-scans/
```
> ✍ This documentation is currently work-in-progress.

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascade.amassNmap | bool | `false` | True if you want to cascade nmap scans for each subdomain found by amass, otherwise false. |
| cascade.nmapNikto | bool | `false` | True if you want to cascade Nikto scans for each HTTP Port found by nmap, otherwise false. |
| cascade.nmapSmb | bool | `false` | True if you want to cascade nmap SMB scans for each SMB Port found by nmap, otherwise false. |
| cascade.nmapSsh | bool | `false` | True if you want to cascade SSH scans for each SSH Port found by nmap, otherwise false. |
| cascade.nmapSsl | bool | `false` | True if you want to cascade SSL scans for each HTTP Port found by nmap, otherwise false. |
| cascade.nmapZapBaseline | bool | `false` | True if you want to cascade ZAP scans for each HTTP Port found by nmap, otherwise false. |
| image.repository | string | `"docker.io/scbexperimental/hook-imperative-subsequent-scans"` | Hook image repository |
| image.tag | string | `nil` |  |
