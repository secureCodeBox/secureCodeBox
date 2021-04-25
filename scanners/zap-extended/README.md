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
| zapConfiguration.contexts | list | `[{"authentication":{"basic-auth":{"hostname":"https://example.com/","port":8080,"realm":"Realm"},"form-based":{"loginRequestData":"username%3D%7B%25username%25%7D%26password%3D%7B%25password%25%7D","loginUrl":"http://localhost:8090/bodgeit/login.jsp"},"json-based":{"loginRequestData":"{\"user\":{\"id\":1,\"email\":\"test@test.com\"}}","loginUrl":"http://localhost:3000/rest/user/login"},"script-based":{"scriptArguments":{"sub":"secureCodeBox@iteratec.com"},"scriptDescription":"This is a description","scriptEngine":"Oracle Nashorn","scriptFileName":"/zap/scripts/authentication/TwoStepAuthentication.js"},"type":"script-based","verification":{"isLoggedInIndicator":"","isLoggedOutIndicator":""}},"excludePaths":[".*\\.js",".*\\.css",".*\\.png",".*\\.jpeg"],"includePaths":["https://example.com/.*"],"name":"scbcontext","session":{"scriptBasedSessionManagement":{"scriptDescription":"This is a session script description.","scriptEngine":"Oracle Nashorn","scriptFileName":"/zap/scripts/session/TwoStepAuthentication.js","scriptName":"mysession"},"type":"scriptBasedSessionManagement"},"technology":{"excluded":null,"included":null},"url":"https://example.com/","users":[{"forced":true,"name":"test-user-1","password":"password1","username":"user1"},{"name":"test-user-2","password":"password2","username":"user2"}]}]` | Optional list of ZAP Context definitions |
| zapConfiguration.contexts[0].authentication | object | `{"basic-auth":{"hostname":"https://example.com/","port":8080,"realm":"Realm"},"form-based":{"loginRequestData":"username%3D%7B%25username%25%7D%26password%3D%7B%25password%25%7D","loginUrl":"http://localhost:8090/bodgeit/login.jsp"},"json-based":{"loginRequestData":"{\"user\":{\"id\":1,\"email\":\"test@test.com\"}}","loginUrl":"http://localhost:3000/rest/user/login"},"script-based":{"scriptArguments":{"sub":"secureCodeBox@iteratec.com"},"scriptDescription":"This is a description","scriptEngine":"Oracle Nashorn","scriptFileName":"/zap/scripts/authentication/TwoStepAuthentication.js"},"type":"script-based","verification":{"isLoggedInIndicator":"","isLoggedOutIndicator":""}}` | Authentiation Configuration that can be uses by ZAP Spider and/or Scanner. You need to reference the `context` name in the corresponding `zapConfiguration.spiders[0].context` and `zapConfiguration.scanners[0].context` section. |
| zapConfiguration.contexts[0].authentication.basic-auth | object | `{"hostname":"https://example.com/","port":8080,"realm":"Realm"}` | Configure `type: basic-auth` authentication (more:https://www.zaproxy.org/docs/api/?python#general-steps). |
| zapConfiguration.contexts[0].authentication.form-based | object | `{"loginRequestData":"username%3D%7B%25username%25%7D%26password%3D%7B%25password%25%7D","loginUrl":"http://localhost:8090/bodgeit/login.jsp"}` | Configure `type: form-based` authentication (more: https://www.zaproxy.org/docs/api/#form-based-authentication). |
| zapConfiguration.contexts[0].authentication.json-based | object | `{"loginRequestData":"{\"user\":{\"id\":1,\"email\":\"test@test.com\"}}","loginUrl":"http://localhost:3000/rest/user/login"}` | Configure `type: json-based` authentication (more: https://www.zaproxy.org/docs/api/#json-based-authentication). |
| zapConfiguration.contexts[0].authentication.script-based | object | `{"scriptArguments":{"sub":"secureCodeBox@iteratec.com"},"scriptDescription":"This is a description","scriptEngine":"Oracle Nashorn","scriptFileName":"/zap/scripts/authentication/TwoStepAuthentication.js"}` | Configure `type: script-based` Authentication: https://www.zaproxy.org/docs/api/#script-based-authentication |
| zapConfiguration.contexts[0].authentication.type | string | `"script-based"` | Currently supports "basic-auth", "form-based", "json-based", "script-based" |
| zapConfiguration.contexts[0].authentication.verification | object | `{"isLoggedInIndicator":"","isLoggedOutIndicator":""}` | Indicates if the current Zap User Session is based on a valid authentication (loggedIn) or not (loggedOut) |
| zapConfiguration.contexts[0].excludePaths | list | `[".*\\.js",".*\\.css",".*\\.png",".*\\.jpeg"]` | An optional list of regexes to exclude |
| zapConfiguration.contexts[0].includePaths | list | `["https://example.com/.*"]` | An optional list of regexes to include |
| zapConfiguration.contexts[0].name | string | `"scbcontext"` | Name to be used to refer to this context in other jobs, mandatory |
| zapConfiguration.contexts[0].session | object | `{"scriptBasedSessionManagement":{"scriptDescription":"This is a session script description.","scriptEngine":"Oracle Nashorn","scriptFileName":"/zap/scripts/session/TwoStepAuthentication.js","scriptName":"mysession"},"type":"scriptBasedSessionManagement"}` | The ZAP session configuration |
| zapConfiguration.contexts[0].session.scriptBasedSessionManagement | object | `{"scriptDescription":"This is a session script description.","scriptEngine":"Oracle Nashorn","scriptFileName":"/zap/scripts/session/TwoStepAuthentication.js","scriptName":"mysession"}` | Additional configrations for the session type "scriptBasedSessionManagement" |
| zapConfiguration.contexts[0].session.scriptBasedSessionManagement.scriptDescription | string | `"This is a session script description."` | An optional description used for the script. |
| zapConfiguration.contexts[0].session.scriptBasedSessionManagement.scriptEngine | string | `"Oracle Nashorn"` | Possible Script engine values: 'Oracle Nashorn' for Javascript, 'jython' for python, 'JSR 223 JRuby Engine' for ruby |
| zapConfiguration.contexts[0].session.scriptBasedSessionManagement.scriptFileName | string | `"/zap/scripts/session/TwoStepAuthentication.js"` | Must be a full path to the script file inside the ZAP container (corresponding to the configMap FileMount) |
| zapConfiguration.contexts[0].session.type | string | `"scriptBasedSessionManagement"` | Currently supports the following types: "scriptBasedSessionManagement", "cookieBasedSessionManagement", "httpAuthSessionManagement" |
| zapConfiguration.contexts[0].technology | object | `{"excluded":null,"included":null}` | Optional technology list |
| zapConfiguration.contexts[0].technology.excluded | string | `nil` | By default all technologies are enabed for each context by default by ZAP. You can use the following config to change that explicitly. |
| zapConfiguration.contexts[0].technology.included | string | `nil` | By default all technologies are enabed for each context by default by ZAP. You can use the following config to change that explicitly. |
| zapConfiguration.contexts[0].url | string | `"https://example.com/"` | The top level url, mandatory, everything under this will be included |
| zapConfiguration.contexts[0].users | list | `[{"forced":true,"name":"test-user-1","password":"password1","username":"user1"},{"name":"test-user-2","password":"password2","username":"user2"}]` | A list of users with credentials which can be referenced by spider or scanner configurations to run them authenticated (you have to configure the authentiation settings). |
| zapConfiguration.contexts[0].users[0].forced | bool | `true` | Optional, could be set to True only once in the users list. If not defined the first user in the list will be forced by default. |
| zapConfiguration.contexts[0].users[0].name | string | `"test-user-1"` | The name of this user configuration |
| zapConfiguration.contexts[0].users[0].password | string | `"password1"` | The password used to authenticate this user |
| zapConfiguration.contexts[0].users[0].username | string | `"user1"` | The username used to authenticate this user |
| zapConfiguration.global | object | `{}` |  |
| zapConfiguration.openApis | object | `{}` | Optional list of ZAP OpenAPI configurations  - NOT YET IMPLEMENTED |
| zapConfiguration.scanners | list | `[{"addQueryParam":false,"context":"scbcontext","defaultPolicy":"Default Policy","delayInMs":0,"handleAntiCSRFTokens":false,"injectPluginIdInHeader":false,"maxRuleDurationInMins":0,"maxScanDurationInMins":0,"name":"scbscan","policy":"Default Policy","policyDefinition":{},"scanHeadersAllRequests":false,"threadPerHost":2,"url":"https://example.com/"}]` | Optional list of ZAP Active Scanner configurations |
| zapConfiguration.scanners[0].addQueryParam | bool | `false` | Bool: If set will add an extra query parameter to requests that do not have one, default: false |
| zapConfiguration.scanners[0].context | string | `"scbcontext"` | String: Name of the context to attack, default: first context |
| zapConfiguration.scanners[0].defaultPolicy | string | `"Default Policy"` | String: The name of the default scan policy to use, default: Default Policy |
| zapConfiguration.scanners[0].delayInMs | int | `0` | Int: The delay in milliseconds between each request, use to reduce the strain on the target, default 0 |
| zapConfiguration.scanners[0].handleAntiCSRFTokens | bool | `false` | Bool: If set then automatically handle anti CSRF tokens, default: false |
| zapConfiguration.scanners[0].injectPluginIdInHeader | bool | `false` | Bool: If set then the relevant rule Id will be injected into the X-ZAP-Scan-ID header of each request, default: false            |
| zapConfiguration.scanners[0].maxRuleDurationInMins | int | `0` | Int: The max time in minutes any individual rule will be allowed to run for, default: 0 unlimited |
| zapConfiguration.scanners[0].maxScanDurationInMins | int | `0` | Int: The max time in minutes the active scanner will be allowed to run for, default: 0 unlimited           |
| zapConfiguration.scanners[0].name | string | `"scbscan"` | String: Name of the context to attack, default: first context |
| zapConfiguration.scanners[0].policy | string | `"Default Policy"` | String: Name of the scan policy to be used, default: Default Policy |
| zapConfiguration.scanners[0].policyDefinition | object | `{}` | The policy definition, only used if the 'policy' is not set - NOT YET IMPLEMENTED |
| zapConfiguration.scanners[0].scanHeadersAllRequests | bool | `false` | Bool: If set then the headers of requests that do not include any parameters will be scanned, default: false |
| zapConfiguration.scanners[0].threadPerHost | int | `2` | Int: The max number of threads per host, default: 2 |
| zapConfiguration.scanners[0].url | string | `"https://example.com/"` | String: Url to start scaning from, default: first context URL |
| zapConfiguration.spiders | list | `[{"acceptCookies":true,"ajax":false,"context":"scbcontext","failIfFoundUrlsLessThan":0,"handleODataParametersVisited":false,"handleParameters":"use_all","maxChildren":10,"maxDepth":5,"maxDuration":0,"maxParseSizeBytes":2621440,"name":"scbspider","parseComments":true,"parseGit":false,"parseRobotsTxt":true,"parseSVNEntries":false,"parseSitemapXml":true,"postForm":true,"processForm":true,"requestWaitTime":200,"sendRefererHeader":true,"threadCount":2,"url":"https://example.com/","user":"test-user-1","userAgent":"secureCodeBox / ZAP Spider","warnIfFoundUrlsLessThan":0}]` | Optional list of ZAP Spider configurations |
| zapConfiguration.spiders[0].acceptCookies | bool | `true` | Bool: Whether the spider will accept cookies, default: true |
| zapConfiguration.spiders[0].ajax | bool | `false` | Bool: Whether to use the ZAP ajax spider, default: false |
| zapConfiguration.spiders[0].failIfFoundUrlsLessThan | int | `0` | Int: Fail if spider finds less than the specified number of URLs, default: 0 |
| zapConfiguration.spiders[0].handleODataParametersVisited | bool | `false` | Bool: Whether the spider will handle OData responses, default: false |
| zapConfiguration.spiders[0].handleParameters | string | `"use_all"` | Enum [ignore_completely, ignore_value, use_all]: How query string parameters are used when checking if a URI has already been visited, default: use_all |
| zapConfiguration.spiders[0].maxChildren | int | `10` | Int: The maximum number of children to add to each node in the tree                      |
| zapConfiguration.spiders[0].maxDepth | int | `5` | Int: The maximum tree depth to explore, default 5 |
| zapConfiguration.spiders[0].maxDuration | int | `0` | Int: The max time in minutes the spider will be allowed to run for, default: 0 unlimited |
| zapConfiguration.spiders[0].maxParseSizeBytes | int | `2621440` | Int: The max size of a response that will be parsed, default: 2621440 - 2.5 Mb |
| zapConfiguration.spiders[0].name | string | `"scbspider"` | The Name of the context (zapConfiguration.contexts[x].name) to spider, default: first context available |
| zapConfiguration.spiders[0].parseComments | bool | `true` | Bool: Whether the spider will parse HTML comments in order to find URLs, default: true |
| zapConfiguration.spiders[0].parseGit | bool | `false` | Bool: Whether the spider will parse Git metadata in order to find URLs, default: false |
| zapConfiguration.spiders[0].parseRobotsTxt | bool | `true` | Bool: Whether the spider will parse 'robots.txt' files in order to find URLs, default: true |
| zapConfiguration.spiders[0].parseSVNEntries | bool | `false` | Bool: Whether the spider will parse SVN metadata in order to find URLs, default: false |
| zapConfiguration.spiders[0].parseSitemapXml | bool | `true` | Bool: Whether the spider will parse 'sitemap.xml' files in order to find URLs, default: true |
| zapConfiguration.spiders[0].postForm | bool | `true` | Bool: Whether the spider will submit POST forms, default: true |
| zapConfiguration.spiders[0].processForm | bool | `true` | Bool: Whether the spider will process forms, default: true |
| zapConfiguration.spiders[0].requestWaitTime | int | `200` | Int: The time between the requests sent to a server in milliseconds, default: 200 |
| zapConfiguration.spiders[0].sendRefererHeader | bool | `true` | Bool: Whether the spider will send the referer header, default: true |
| zapConfiguration.spiders[0].threadCount | int | `2` | Int: The number of spider threads, default: 2              |
| zapConfiguration.spiders[0].url | string | `"https://example.com/"` | Url to start spidering from, default: first context URL |
| zapConfiguration.spiders[0].user | string | `"test-user-1"` | The Name of the user (zapConfiguration.contexts[0].users[0].name) used to authenticate the spider with |
| zapConfiguration.spiders[0].userAgent | string | `"secureCodeBox / ZAP Spider"` | String: The user agent to use in requests, default: '' - use the default ZAP one                |
| zapConfiguration.spiders[0].warnIfFoundUrlsLessThan | int | `0` | Int: Warn if spider finds less than the specified number of URLs, default: 0 |
