# zap-advanced

![Version: v2.7.0-alpha1](https://img.shields.io/badge/Version-v2.7.0--alpha1-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 2.10.0](https://img.shields.io/badge/AppVersion-2.10.0-informational?style=flat-square)

A Helm chart for the OWASP ZAP (extended with advanced authentication features) security scanner that integrates with the secureCodeBox.

**Homepage:** <https://docs.securecodebox.io/docs/scanners/ZAP>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| iteratec GmbH | secureCodeBox@iteratec.com |  |

## Source Code

* <https://github.com/secureCodeBox/secureCodeBox>

## Requirements

Kubernetes: `>=v1.11.0-0`

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascadingRules | object | `{"enabled":true}` | Configurations regarding the cascading scan |
| cascadingRules.enabled | bool | `true` | Enables or disables the installation of the default cascading rules for this scanner |
| parser.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| parser.image.repository | string | `"docker.io/securecodebox/parser-zap"` | Parser image repository |
| parser.image.tag | string | `nil` | Parser image tag |
| parser.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| scanner.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scanner.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scanner.envFrom | list | `[]` | Optional mount environment variables from configMaps or secrets (see: https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/#configure-all-key-value-pairs-in-a-secret-as-container-environment-variables) |
| scanner.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scanner.extraVolumeMounts | list | `[{"mountPath":"/home/securecodebox/configs/1-zap-advanced-scantype.yaml","name":"zap-advanced-scantype-config","readOnly":true,"subPath":"1-zap-advanced-scantype.yaml"}]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.extraVolumes | list | `[{"configMap":{"name":"zap-advanced-scantype-config"},"name":"zap-advanced-scantype-config"},{"configMap":{"name":"zap-scripts-authentication"},"name":"zap-scripts-authentication"},{"configMap":{"name":"zap-scripts-session"},"name":"zap-scripts-session"}]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| scanner.image.repository | string | `"docker.io/securecodebox/scanner-zap-advanced"` | Container Image to run the scan |
| scanner.image.tag | string | `nil` | defaults to the charts appVersion |
| scanner.nameAppend | string | `nil` | append a string to the default scantype name. |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.securityContext | object | `{}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| zapConfiguration | object | `{"global":{"addonInstall":["pscanrulesBeta","ascanrulesBeta","pscanrulesAlpha","ascanrulesAlpha"],"addonUpdate":true,"sessionName":"secureCodeBox"}}` | All `scanType` specific configuration options. Feel free to add more configuration options. All configuration options can be overriden by scan specific configurations if defined. Please have a look into the README.md to find more configuration options. |
| zapConfiguration.global | object | `{"addonInstall":["pscanrulesBeta","ascanrulesBeta","pscanrulesAlpha","ascanrulesAlpha"],"addonUpdate":true,"sessionName":"secureCodeBox"}` | Optional general ZAP Configurations settings. |
| zapConfiguration.global.addonInstall | list | `["pscanrulesBeta","ascanrulesBeta","pscanrulesAlpha","ascanrulesAlpha"]` | Installs additional ZAP AddOns on startup, listed by their name: |
| zapConfiguration.global.addonUpdate | bool | `true` | Updates all installed ZAP AddOns on startup if true, otherwise false. |
| zapConfiguration.global.sessionName | string | `"secureCodeBox"` | The ZAP internal Session name. Default: secureCodeBox |
| zapContainer.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| zapContainer.envFrom | list | `[]` | Optional mount environment variables from configMaps or secrets (see: https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/#configure-all-key-value-pairs-in-a-secret-as-container-environment-variables) |
| zapContainer.extraVolumeMounts | list | `[{"mountPath":"/home/zap/.ZAP_D/scripts/scripts/authentication/","name":"zap-scripts-authentication","readOnly":true},{"mountPath":"/home/zap/.ZAP_D/scripts/scripts/session/","name":"zap-scripts-session","readOnly":true}]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| zapContainer.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| zapContainer.image.repository | string | `"owasp/zap2docker-stable"` | Container Image to run the scan |
| zapContainer.image.tag | string | `nil` | defaults to the charts appVersion |
| zapContainer.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| zapContainer.securityContext | object | `{}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |

