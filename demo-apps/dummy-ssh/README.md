# dummy-ssh

![Version: latest](https://img.shields.io/badge/Version-latest-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: v1.0.0](https://img.shields.io/badge/AppVersion-v1.0.0-informational?style=flat-square)

SSH Server for scan testing.

**Homepage:** <https://wordpress.org>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| iteratec GmbH | security@iteratec.com |  |

## Source Code

* <https://github.com/secureCodeBox/secureCodeBox/tree/master/demo/dummy-ssh>

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| fullnameOverride | string | `""` |  |
| image.pullPolicy | string | `"IfNotPresent"` |  |
| image.repository | string | `"securecodebox/dummy-ssh"` |  |
| imagePullSecrets | list | `[]` |  |
| nameOverride | string | `""` |  |
| nodeSelector | object | `{}` |  |
| podSecurityContext | object | `{}` |  |
| replicaCount | int | `1` |  |
| resources | object | `{}` |  |
| securityContext | object | `{}` |  |
| service.port | int | `22` |  |
| service.type | string | `"ClusterIP"` |  |
| tolerations | list | `[]` |  |
