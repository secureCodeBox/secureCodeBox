# old-wordpress

![Version: latest](https://img.shields.io/badge/Version-latest-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 4.0](https://img.shields.io/badge/AppVersion-4.0-informational?style=flat-square)

Insecure & Outdated Wordpress Instance: Never expose it to the internet!

**Homepage:** <https://wordpress.org>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| iteratec GmbH | security@iteratec.com |  |

## Source Code

* <https://github.com/secureCodeBox/helm>
* <https://github.com/secureCodeBox/secureCodeBox/tree/master/demo/old-wordpress>

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| fullnameOverride | string | `""` |  |
| image.pullPolicy | string | `"IfNotPresent"` |  |
| image.repository | string | `"securecodebox/old-wordpress"` |  |
| imagePullSecrets | list | `[]` |  |
| nameOverride | string | `""` |  |
| nodeSelector | object | `{}` |  |
| podSecurityContext | object | `{}` |  |
| replicaCount | int | `1` |  |
| resources | object | `{}` |  |
| securityContext | object | `{}` |  |
| service.port | int | `80` |  |
| service.type | string | `"ClusterIP"` |  |
| tolerations | list | `[]` |  |
