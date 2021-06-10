# juice-shop

![Version: latest](https://img.shields.io/badge/Version-latest-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: v12.0.2](https://img.shields.io/badge/AppVersion-v12.0.2-informational?style=flat-square)

OWASP Juice Shop: Probably the most modern and sophisticated insecure web application

**Homepage:** <https://owasp.org/www-project-juice-shop/>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| iteratec GmbH | securecodebox@iteratec.com |  |

## Source Code

* <https://github.com/secureCodeBox/secureCodeBox/tree/master/demo-apps/juice-shop>
* <https://github.com/bkimminich/juice-shop>

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| annotations | object | `{}` | add annotations to the deployment, service and pods |
| fullnameOverride | string | `""` |  |
| image.pullPolicy | string | `"IfNotPresent"` |  |
| image.repository | string | `"docker.io/bkimminich/juice-shop"` | Container Image containing the juice-shop |
| image.tag | string | defaults to the appVersion | The image tag |
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
| service.port | int | `3000` |  |
| service.type | string | `"ClusterIP"` |  |
| tolerations | list | `[]` |  |
