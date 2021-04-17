---
title: "ZAP Extended"
category: "scanner"
type: "WebApplication"
state: "released"
appVersion: "2.10.0"
usecase: "WebApp & OpenAPI Vulnerability Scanner extend with authentication features"
---

![zap logo](https://raw.githubusercontent.com/wiki/zaproxy/zaproxy/images/zap32x32.png)

The OWASP Zed Attack Proxy (ZAP) is one of the world’s most popular free security tools and is actively maintained by hundreds of international volunteers*. It can help you automatically find security vulnerabilities in your web applications while you are developing and testing your applications. Its also a great tool for experienced pentesters to use for manual security testing.

To learn more about the ZAP scanner itself visit [https://www.zaproxy.org/](https://www.zaproxy.org/).

<!-- end -->

## Deployment

The ZAP-Extended scanType can be deployed via helm:

```bash
helm upgrade --install zap-extended secureCodeBox/zap-extended
```

## Scanner Configuration

The following security scan configuration example are based on the ZAP Docker Scan Scripts. By default the secureCodeBox ZAP Helm Chart installs all three ZAP scripts: `zap-extended-baseline-scan`, `zap-extended-full-scan` & `zap-extended-api-scan`. Listed below are the arguments supported by the `zap-extended-baseline-scan` script, which are mostly interchangable with the other ZAP scripts. For a more complete reference check out the [ZAP Documentation](https://www.zaproxy.org/docs/docker/) and the secureCodeBox based ZAP examples listed below.

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
| image.repository | string | `"docker.io/securecodebox/scanner-zap-extended"` | Container Image to run the scan |
| image.tag | string | `nil` | defaults to the charts appVersion |
| parseJob.backoffLimit | int | `3` |  |
| parseJob.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| parserImage.repository | string | `"docker.io/securecodebox/parser-zap"` | Parser image repository |
| parserImage.tag | string | defaults to the charts version | Parser image tag |
| scannerJob.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scannerJob.env | list | `[{"name":"SCB_ZAP_CONFIG_DIR","value":"/zap/secureCodeBox-extensions/configs/"}]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scannerJob.envFrom | list | `[]` | Optional mount environment variables from configMaps or secrets (see: https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/#configure-all-key-value-pairs-in-a-secret-as-container-environment-variables) |
| scannerJob.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scannerJob.extraVolumeMounts | list | `[{"mountPath":"/zap/wrk","name":"zap-workdir"},{"mountPath":"/zap/secureCodeBox-extensions/configs/1-zap-extended-scantype.yaml","name":"zap-extended-scantype-config","readOnly":true,"subPath":"1-zap-extended-scantype.yaml"}]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.extraVolumes | list | `[{"emptyDir":{},"name":"zap-workdir"},{"configMap":{"name":"zap-extended-scantype-config"},"name":"zap-extended-scantype-config"}]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scannerJob.securityContext | object | `{"fsGroup":1000}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scannerJob.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| zapExtendedConfigs.contexts[0].authentication.basic-auth | object | `{}` |  |
| zapExtendedConfigs.contexts[0].authentication.form-based | object | `{}` |  |
| zapExtendedConfigs.contexts[0].authentication.json-based | object | `{}` |  |
| zapExtendedConfigs.contexts[0].authentication.script-based.scriptArguments.email | string | `"secureCodeBox@teratec.com"` |  |
| zapExtendedConfigs.contexts[0].authentication.script-based.scriptArguments.exp | string | `"1609459140"` |  |
| zapExtendedConfigs.contexts[0].authentication.script-based.scriptArguments.sub | string | `"secureCodeBox@iteratec.com"` |  |
| zapExtendedConfigs.contexts[0].authentication.script-based.scriptDescription | string | `"This is a description"` |  |
| zapExtendedConfigs.contexts[0].authentication.script-based.scriptEngine | string | `"Oracle Nashorn"` |  |
| zapExtendedConfigs.contexts[0].authentication.script-based.scriptFileName | string | `"/zap/scripts/authentication/TwoStepAuthentication.js"` |  |
| zapExtendedConfigs.contexts[0].authentication.type | string | `"script-based"` |  |
| zapExtendedConfigs.contexts[0].authentication.verification.isLoggedInIndicator | string | `""` |  |
| zapExtendedConfigs.contexts[0].authentication.verification.isLoggedOutIndicator | string | `""` |  |
| zapExtendedConfigs.contexts[0].excludePaths[0] | string | `"https://example.com/authserver/v1/.*"` |  |
| zapExtendedConfigs.contexts[0].excludePaths[1] | string | `".*\\.js"` |  |
| zapExtendedConfigs.contexts[0].excludePaths[2] | string | `".*\\.css"` |  |
| zapExtendedConfigs.contexts[0].excludePaths[3] | string | `".*\\.png"` |  |
| zapExtendedConfigs.contexts[0].excludePaths[4] | string | `".*\\.jpeg"` |  |
| zapExtendedConfigs.contexts[0].includePaths[0] | string | `"https://example.com/.*"` |  |
| zapExtendedConfigs.contexts[0].name | string | `"scbcontext"` |  |
| zapExtendedConfigs.contexts[0].session.scriptBasedSessionManagement.scriptDescription | string | `"This is a session script description."` |  |
| zapExtendedConfigs.contexts[0].session.scriptBasedSessionManagement.scriptEngine | string | `"Oracle Nashorn"` |  |
| zapExtendedConfigs.contexts[0].session.scriptBasedSessionManagement.scriptFileName | string | `"/zap/scripts/session/TwoStepAuthentication.js"` |  |
| zapExtendedConfigs.contexts[0].session.scriptBasedSessionManagement.scriptName | string | `"mysession"` |  |
| zapExtendedConfigs.contexts[0].session.type | string | `"scriptBasedSessionManagement"` |  |
| zapExtendedConfigs.contexts[0].technology.excluded[0] | string | `"SCM"` |  |
| zapExtendedConfigs.contexts[0].technology.included[0] | string | `"Db.CouchDB"` |  |
| zapExtendedConfigs.contexts[0].technology.included[1] | string | `"Db.Firebird"` |  |
| zapExtendedConfigs.contexts[0].technology.included[2] | string | `"Db.HypersonicSQL"` |  |
| zapExtendedConfigs.contexts[0].technology.included[3] | string | `"Language.ASP"` |  |
| zapExtendedConfigs.contexts[0].technology.included[4] | string | `"OS"` |  |
| zapExtendedConfigs.contexts[0].url | string | `"https://example.com/"` |  |
| zapExtendedConfigs.contexts[0].users[0].name | string | `"testuser1"` |  |
| zapExtendedConfigs.contexts[0].users[0].password | string | `"password1"` |  |
| zapExtendedConfigs.contexts[0].users[0].username | string | `"user1"` |  |
| zapExtendedConfigs.contexts[0].users[1].forced | bool | `true` |  |
| zapExtendedConfigs.contexts[0].users[1].name | string | `"testuser2"` |  |
| zapExtendedConfigs.contexts[0].users[1].password | string | `"password2"` |  |
| zapExtendedConfigs.contexts[0].users[1].username | string | `"user2"` |  |
| zapExtendedConfigs.scans[0].addQueryParam | bool | `false` |  |
| zapExtendedConfigs.scans[0].context | string | `"scbcontext"` |  |
| zapExtendedConfigs.scans[0].defaultPolicy | string | `nil` |  |
| zapExtendedConfigs.scans[0].delayInMs | int | `0` |  |
| zapExtendedConfigs.scans[0].handleAntiCSRFTokens | bool | `false` |  |
| zapExtendedConfigs.scans[0].injectPluginIdInHeader | bool | `false` |  |
| zapExtendedConfigs.scans[0].maxRuleDurationInMins | int | `0` |  |
| zapExtendedConfigs.scans[0].maxScanDurationInMins | int | `0` |  |
| zapExtendedConfigs.scans[0].name | string | `"scbscan"` |  |
| zapExtendedConfigs.scans[0].policy | string | `nil` |  |
| zapExtendedConfigs.scans[0].policyDefinition.defaultStrength | string | `"Medium"` |  |
| zapExtendedConfigs.scans[0].policyDefinition.defaultThreshold | string | `"Medium"` |  |
| zapExtendedConfigs.scans[0].policyDefinition.rules[0].id | string | `nil` |  |
| zapExtendedConfigs.scans[0].policyDefinition.rules[0].name | string | `nil` |  |
| zapExtendedConfigs.scans[0].policyDefinition.rules[0].strength | string | `nil` |  |
| zapExtendedConfigs.scans[0].policyDefinition.rules[0].threshold | string | `nil` |  |
| zapExtendedConfigs.scans[0].scanHeadersAllRequests | bool | `false` |  |
| zapExtendedConfigs.scans[0].threadPerHost | int | `2` |  |
| zapExtendedConfigs.scans[0].url | string | `"https://example.com/"` |  |
| zapExtendedConfigs.spiders[0].acceptCookies | bool | `true` |  |
| zapExtendedConfigs.spiders[0].context | string | `"scbcontext"` |  |
| zapExtendedConfigs.spiders[0].failIfFoundUrlsLessThan | int | `0` |  |
| zapExtendedConfigs.spiders[0].handleODataParametersVisited | bool | `false` |  |
| zapExtendedConfigs.spiders[0].handleParameters | string | `"use_all"` |  |
| zapExtendedConfigs.spiders[0].maxChildren | string | `nil` |  |
| zapExtendedConfigs.spiders[0].maxDepth | int | `5` |  |
| zapExtendedConfigs.spiders[0].maxDuration | int | `0` |  |
| zapExtendedConfigs.spiders[0].maxParseSizeBytes | int | `2621440` |  |
| zapExtendedConfigs.spiders[0].name | string | `"scbspider"` |  |
| zapExtendedConfigs.spiders[0].parseComments | bool | `true` |  |
| zapExtendedConfigs.spiders[0].parseGit | bool | `false` |  |
| zapExtendedConfigs.spiders[0].parseRobotsTxt | bool | `true` |  |
| zapExtendedConfigs.spiders[0].parseSVNEntries | bool | `false` |  |
| zapExtendedConfigs.spiders[0].parseSitemapXml | bool | `true` |  |
| zapExtendedConfigs.spiders[0].postForm | bool | `true` |  |
| zapExtendedConfigs.spiders[0].processForm | bool | `true` |  |
| zapExtendedConfigs.spiders[0].requestWaitTime | int | `200` |  |
| zapExtendedConfigs.spiders[0].sendRefererHeader | bool | `true` |  |
| zapExtendedConfigs.spiders[0].threadCount | int | `2` |  |
| zapExtendedConfigs.spiders[0].url | string | `"https://example.com/"` |  |
| zapExtendedConfigs.spiders[0].userAgent | string | `""` |  |
| zapExtendedConfigs.spiders[0].warnIfFoundUrlsLessThan | int | `0` |  |
