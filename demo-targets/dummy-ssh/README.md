# dummy-ssh

![Version: latest](https://img.shields.io/badge/Version-latest-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: v1.0.0](https://img.shields.io/badge/AppVersion-v1.0.0-informational?style=flat-square)

Vulnerable SSH Server for scan testing.
Port 22: Username root, Password: THEPASSWORDYOUCREATED

**Homepage:** <https://docs.securecodebox.io>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| iteratec GmbH | securecodebox@iteratec.com |  |

## Source Code

* <https://github.com/secureCodeBox/secureCodeBox/tree/master/demo-targets/dummy-ssh>

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| annotations | object | `{}` | add annotations to the deployment, service and pods |
| fullnameOverride | string | `""` |  |
| image.pullPolicy | string | `"IfNotPresent"` |  |
| image.repository | string | `"docker.io/securecodebox/dummy-ssh"` | Container Image |
| image.tag | string | defaults to the appVersion | The image tag |
| imagePullSecrets | list | `[]` |  |
| labels | object | `{}` | add labels to the deployment, service and pods |
| nameOverride | string | `""` |  |
| nodeSelector | object | `{}` |  |
| podSecurityContext | object | `{}` |  |
| replicaCount | int | `1` |  |
| resources | object | `{}` |  |
| securityContext | object | `{}` |  |
| service.port | int | `22` |  |
| service.type | string | `"ClusterIP"` |  |
| tolerations | list | `[]` |  |
