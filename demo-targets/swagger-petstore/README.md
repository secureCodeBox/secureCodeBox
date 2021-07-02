# swagger-petstore

![Version: v2.7.0-alpha1](https://img.shields.io/badge/Version-v2.7.0--alpha1-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 1.0.3](https://img.shields.io/badge/AppVersion-1.0.3-informational?style=flat-square)

This is the sample petstore application

**Homepage:** <https://github.com/swagger-api/swagger-petstore>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| iteratec GmbH | securecodebox@iteratec.com |  |

## Source Code

* <https://github.com/secureCodeBox/secureCodeBox/tree/master/demo-targets/swagger-petstore>
* <https://github.com/swagger-api/swagger-petstore>

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| annotations | object | `{}` | add annotations to the deployment, service and pods |
| fullnameOverride | string | `""` |  |
| image.pullPolicy | string | `"IfNotPresent"` |  |
| image.repository | string | `"docker.io/swaggerapi/petstore"` | Container Image |
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
| service.port | int | `80` |  |
| service.type | string | `"ClusterIP"` |  |
| swaggerHostOverride | string | `"http://swagger-petstore.demo-targets.svc"` |  |
| tolerations | list | `[]` |  |

