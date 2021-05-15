---
title: "ZAP Extended"
category: "scanner"
type: "WebApplication"
state: "released"
appVersion: "2.10.0"
usecase: "WebApp & OpenAPI Vulnerability Scanner extend with authentication features"
---

![zap logo](https://raw.githubusercontent.com/wiki/zaproxy/zaproxy/images/zap32x32.png)

The OWASP Zed Attack Proxy (ZAP) is one of the world’s most popular free security tools and is actively maintained by hundreds of international volunteers*. It can help you automatically find security vulnerabilities in your web applications while you are developing and testing your applications. It is also a great tool for experienced pentesters to use for manual security testing.

To learn more about the ZAP scanner itself visit [https://www.zaproxy.org/](https://www.zaproxy.org/).

<!-- end -->

## Deployment

The ZAP-advanced scanType can be deployed via helm:

```bash
helm upgrade --install zap-advanced secureCodeBox/zap-advanced
```

## Scanner Configuration

The following security scan configuration example are based on the ZAP Docker Scan Scripts. By default the secureCodeBox ZAP Helm Chart installs all three ZAP scripts: `zap-advanced-baseline-scan`, `zap-advanced-full-scan` & `zap-advanced-api-scan`. Listed below are the arguments supported by the `zap-advanced-baseline-scan` script, which are mostly interchangable with the other ZAP scripts. For a more complete reference check out the [ZAP Documentation](https://www.zaproxy.org/docs/docker/) and the secureCodeBox based ZAP examples listed below.

The command line interface can be used to easily run server scans: `-t www.example.com`

```bash
Usage: zap-baseline.py -t <target> [options]
    -t target         target URL including the protocol, eg https://www.example.com
Options:
    -h                print this help message
    -c config_file    config file to use to INFO, IGNORE or FAIL warnings
    -u config_url     URL of config file to use to INFO, IGNORE or FAIL warnings
    -g gen_file       generate default config file (all rules set to WARN)
    -m mins           the number of minutes to spider for (default 1)
    -r report_html    file to write the full ZAP HTML report
    -w report_md      file to write the full ZAP Wiki (Markdown) report
    -x report_xml     file to write the full ZAP XML report
    -J report_json    file to write the full ZAP JSON document
    -a                include the alpha passive scan rules as well
    -d                show debug messages
    -P                specify listen port
    -D                delay in seconds to wait for passive scanning
    -i                default rules not in the config file to INFO
    -I                do not return failure on warning
    -j                use the Ajax spider in addition to the traditional one
    -l level          minimum level to show: PASS, IGNORE, INFO, WARN or FAIL, use with -s to hide example URLs
    -n context_file   context file which will be loaded prior to spidering the target
    -p progress_file  progress file which specifies issues that are being addressed
    -s                short output format - dont show PASSes or example URLs
    -T                max time in minutes to wait for ZAP to start and the passive scan to run
    -z zap_options    ZAP command line options e.g. -z "-config aaa=bbb -config ccc=ddd"
    --hook            path to python file that define your custom hooks
```

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascadingRules.enabled | bool | `true` | Enables or disables the installation of the default cascading rules for this scanner |
| parseJob.backoffLimit | int | `3` |  |
| parseJob.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| parseJob.image.repository | string | `"docker.io/securecodebox/parser-zap"` | Parser image repository |
| parseJob.image.tag | string | `nil` | Parser image tag |
| parseJob.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| scannerJob.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scannerJob.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scannerJob.envFrom | list | `[]` | Optional mount environment variables from configMaps or secrets (see: https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/#configure-all-key-value-pairs-in-a-secret-as-container-environment-variables) |
| scannerJob.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scannerJob.extraVolumeMounts | list | `[{"mountPath":"/home/securecodebox/configs/1-zap-advanced-scantype.yaml","name":"zap-advanced-scantype-config","readOnly":true,"subPath":"1-zap-advanced-scantype.yaml"}]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.extraVolumes | list | `[{"configMap":{"name":"zap-advanced-scantype-config"},"name":"zap-advanced-scantype-config"},{"configMap":{"name":"zap-scripts-authentication"},"name":"zap-scripts-authentication"},{"configMap":{"name":"zap-scripts-session"},"name":"zap-scripts-session"}]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| scannerJob.image.repository | string | `"docker.io/securecodebox/scanner-zap-advanced"` | Container Image to run the scan |
| scannerJob.image.tag | string | `nil` | defaults to the charts appVersion |
| scannerJob.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scannerJob.securityContext | object | `{}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scannerJob.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| zapConfiguration.global.isNewSession | bool | `true` |  |
| zapConfiguration.global.sessionName | string | `"secureCodeBox"` |  |
| zapContainer.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| zapContainer.envFrom | list | `[]` | Optional mount environment variables from configMaps or secrets (see: https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/#configure-all-key-value-pairs-in-a-secret-as-container-environment-variables) |
| zapContainer.extraVolumeMounts | list | `[{"mountPath":"/home/zap/.ZAP_D/scripts/scripts/authentication/","name":"zap-scripts-authentication","readOnly":true},{"mountPath":"/home/zap/.ZAP_D/scripts/scripts/session/","name":"zap-scripts-session","readOnly":true}]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| zapContainer.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| zapContainer.image.repository | string | `"owasp/zap2docker-stable"` | Container Image to run the scan |
| zapContainer.image.tag | string | `nil` | defaults to the charts appVersion |
| zapContainer.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| zapContainer.securityContext | object | `{}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
