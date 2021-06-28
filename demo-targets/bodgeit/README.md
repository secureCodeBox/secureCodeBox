---
title: "Bodgeit"
category: "target"
type: "Website"
state: "released"
appVersion: "v1.4.0"
usecase: "Vulnerable WebApp based on html serverside rendering"
---

# Bodgeit

![Version: latest](https://img.shields.io/badge/Version-latest-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: v1.4.0](https://img.shields.io/badge/AppVersion-v1.4.0-informational?style=flat-square)

The BodgeIt Store is a vulnerable web app which is aimed at people who are new to pen testing.
BodgeIt Store is a serverside rendering based html website without any heavy javascript.

**Homepage:** <https://github.com/psiinon/bodgeit>

## Source Code

* <https://github.com/secureCodeBox/secureCodeBox/tree/master/demo-targets/bodgeit>
* <https://github.com/psiinon/bodgeit>

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| annotations | object | `{}` | add annotations to the deployment, service and pods |
| fullnameOverride | string | `""` |  |
| image.pullPolicy | string | `"IfNotPresent"` |  |
| image.repository | string | `"docker.io/psiinon/bodgeit"` | Container Image containing the bodgeit |
| image.tag | string | defaults to the "latest" version because the appVersion tag is not available at docker.io | The image tag |
| imagePullSecrets | list | `[]` |  |
| ingress.annotations | object | `{}` |  |
| ingress.enabled | bool | `false` |  |
| ingress.hosts[0].host | string | `"chart-example.local"` |  |
| ingress.hosts[0].paths | list | `[]` |  |
| ingress.tls | list | `[]` |  |
| labels | object | `{}` | add labels to the deployment, service and pods |
| nameOverride | string | `""` |  |
| nodeSelector | object | `{}` |  |
| podSecurityContext | object | `{}` |  |
| replicaCount | int | `1` |  |
| resources | object | `{}` |  |
| securityContext | object | `{}` |  |
| service.port | int | `8080` |  |
| service.type | string | `"ClusterIP"` |  |
| tolerations | list | `[]` |  |
