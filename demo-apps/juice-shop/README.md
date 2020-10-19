# juice-shop

![Version: latest](https://img.shields.io/badge/Version-latest-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: v12.0.2](https://img.shields.io/badge/AppVersion-v12.0.2-informational?style=flat-square)

OWASP Juice Shop: Probably the most modern and sophisticated insecure web application

**Homepage:** <https://owasp.org/www-project-juice-shop/>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| iteratec GmbH | security@iteratec.com |  |

## Source Code

* <https://github.com/secureCodeBox/helm>
* <https://github.com/bkimminich/juice-shop>

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| fullnameOverride | string | `""` |  |
| image.pullPolicy | string | `"IfNotPresent"` |  |
| image.repository | string | `"bkimminich/juice-shop"` |  |
| imagePullSecrets | list | `[]` |  |
| ingress.annotations | object | `{}` |  |
| ingress.enabled | bool | `false` |  |
| ingress.hosts[0].host | string | `"chart-example.local"` |  |
| ingress.hosts[0].paths | list | `[]` |  |
| ingress.tls | list | `[]` |  |
| nameOverride | string | `""` |  |
| nodeSelector | object | `{}` |  |
| podSecurityContext | object | `{}` |  |
| replicaCount | int | `1` |  |
| resources | object | `{}` |  |
| securityContext | object | `{}` |  |
| service.port | int | `3000` |  |
| service.type | string | `"ClusterIP"` |  |
| tolerations | list | `[]` |  |
