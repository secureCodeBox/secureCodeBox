# http-webhook

![Version: latest](https://img.shields.io/badge/Version-latest-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 1.16.0](https://img.shields.io/badge/AppVersion-1.16.0-informational?style=flat-square)

A Dummy webserver to echo HTTP requests in log

**Homepage:** <https://docs.securecodebox.io>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| iteratec GmbH | securecodebox@iteratec.com |  |

## Source Code

* <https://github.com/mendhak/docker-http-https-echo>
* <https://github.com/secureCodeBox/secureCodeBox/tree/master/demo-targets/http-webhook>

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| annotations | object | `{}` | add annotations to the deployment, service and pods |
| autoscaling.enabled | bool | `false` |  |
| autoscaling.maxReplicas | int | `100` |  |
| autoscaling.minReplicas | int | `1` |  |
| autoscaling.targetCPUUtilizationPercentage | int | `80` |  |
| fullnameOverride | string | `""` |  |
| image.pullPolicy | string | `"IfNotPresent"` |  |
| image.repository | string | `"docker.io/mendhak/http-https-echo"` | Container Image |
| image.tag | string | defaults to the latest version because the appVersion tag is not available at docker.io | The image tag |
| imagePullSecrets | list | `[]` |  |
| ingress.annotations | object | `{}` |  |
| ingress.enabled | bool | `false` |  |
| ingress.hosts[0].host | string | `"chart-example.local"` |  |
| ingress.hosts[0].paths | list | `[]` |  |
| ingress.tls | list | `[]` |  |
| labels | object | `{}` | add labels to the deployment, service and pods |
| nameOverride | string | `""` |  |
| nodeSelector | object | `{}` |  |
| podAnnotations | object | `{}` | deprecated. use `labels` instead. Will be removed in v3. todo(@J12934) remove podAnnotations in v3 |
| podSecurityContext | object | `{}` |  |
| replicaCount | int | `1` |  |
| resources | object | `{}` |  |
| securityContext | object | `{}` |  |
| service.port | int | `80` |  |
| service.type | string | `"ClusterIP"` |  |
| serviceAccount.annotations | object | `{}` |  |
| serviceAccount.create | bool | `true` |  |
| serviceAccount.name | string | `""` |  |
| tolerations | list | `[]` |  |
