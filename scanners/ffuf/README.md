---
title: "ffuf"
category: "scanner"
type: "Webserver"
state: "released"
appVersion: "v2.1.0"
usecase: "Webserver and WebApplication Elements and Content Discovery"
---

![ffuf logo](https://raw.githubusercontent.com/ffuf/ffuf/master/_img/ffuf_run_logo_600.png)

<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->
<!--
.: IMPORTANT! :.
--------------------------
This file is generated automatically with `helm-docs` based on the following template files:
- ./.helm-docs/templates.gotmpl (general template data for all charts)
- ./chart-folder/.helm-docs.gotmpl (chart specific template data)

Please be aware of that and apply your changes only within those template files instead of this file.
Otherwise your changes will be reverted/overwritten automatically due to the build process `./.github/workflows/helm-docs.yaml`
--------------------------
-->

<p align="center">
  <a href="https://opensource.org/licenses/Apache-2.0"><img alt="License Apache-2.0" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/releases/latest"><img alt="GitHub release (latest SemVer)" src="https://img.shields.io/github/v/release/secureCodeBox/secureCodeBox?sort=semver"/></a>
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Lab Project" src="https://img.shields.io/badge/OWASP-Lab%20Project-yellow"/></a>
  <a href="https://artifacthub.io/packages/search?repo=securecodebox"><img alt="Artifact HUB" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/securecodebox"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/secureCodeBox/secureCodeBox?logo=GitHub"/></a>
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"/></a>
</p>

## What is ffuf?
FFuf is an open source (MIT license) fuzzing tool to detect content and elements on webservers and web applications.
People often use it as a web directory bruteforcer, but it is also capable of fuzzing much more than that (e.g. XSS, SQLi,...).
To learn more about the ffuf scanner itself visit [ffuf GitHub](https://github.com/ffuf/ffuf).

With this scanner the secure code box also installs SecLists wordlists.

## Deployment
The ffuf chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install ffuf secureCodeBox/ffuf
```

## Scanner Configuration
The mandatory parameters are `-u` and either `-w` or `--input-cmd` (normally `-w` is used):
- `-u`: The url to scan (e.g. https://securecodebox.io/FUZZ), which may also contain the FUZZ keyword.
- `-w`: The path to the wordlist.txt file. How to get your wordlist into the scanner? -> See below at section [Wordlist Configmap](#wordlist-configmap).

To define the test case for ffuf, use the keyword FUZZ anywhere in the URL (-u), headers (-H), or POST data (-d).

Full argument description from ffuf:
````
-HTTP OPTIONS:
-H                  Header `"Name: Value"`, separated by colon. Multiple -H flags are accepted.
-X                  HTTP method to use
-b                  Cookie data `"NAME1=VALUE1; NAME2=VALUE2"` for copy as curl functionality.
-d                  POST data
-ignore-body        Do not fetch the response content. (default: false)
-r                  Follow redirects (default: false)
-recursion          Scan recursively. Only FUZZ keyword is supported, and URL (-u) has to end in it. (default: false)
-recursion-depth    Maximum recursion depth. (default: 0)
-recursion-strategy Recursion strategy: "default" for a redirect based, and "greedy" to recurse on all matches (default: default)
-replay-proxy       Replay matched requests using this proxy.
-sni                Target TLS SNI, does not support FUZZ keyword
-timeout            HTTP request timeout in seconds. (default: 10)
-u                  Target URL
-x                  Proxy URL (SOCKS5 or HTTP). For example: http://127.0.0.1:8080 or socks5://127.0.0.1:8080

GENERAL OPTIONS:
-V                  Show version information. (default: false)
-ac                 Automatically calibrate filtering options (default: false)
-acc                Custom auto-calibration string. Can be used multiple times. Implies -ac
-c                  Colorize output. (default: false)
-config             Load configuration from a file
-maxtime            Maximum running time in seconds for entire process. (default: 0)
-maxtime-job        Maximum running time in seconds per job. (default: 0)
-noninteractive     Disable the interactive console functionality (default: false)
-p                  Seconds of `delay` between requests, or a range of random delay. For example "0.1" or "0.1-2.0"
-rate               Rate of requests per second (default: 0)
-s                  Do not print additional information (silent mode) (default: false)
-sa                 Stop on all error cases. Implies -sf and -se. (default: false)
-se                 Stop on spurious errors (default: false)
-sf                 Stop when > 95% of responses return 403 Forbidden (default: false)
-t                  Number of concurrent threads. (default: 40)
-v                  Verbose output, printing full URL and redirect location (if any) with the results. (default: false)

MATCHER OPTIONS:
-mc                 Match HTTP status codes, or "all" for everything. (default: 200,204,301,302,307,401,403,405,500)
-ml                 Match amount of lines in response
-mr                 Match regexp
-ms                 Match HTTP response size
-mt                 Match how many milliseconds to the first response byte, either greater or less than. EG: >100 or <100
-mw                 Match amount of words in response

FILTER OPTIONS:
-fc                 Filter HTTP status codes from response. Comma separated list of codes and ranges
-fl                 Filter by amount of lines in response. Comma separated list of line counts and ranges
-fr                 Filter regexp
-fs                 Filter HTTP response size. Comma separated list of sizes and ranges
-ft                 Filter by number of milliseconds to the first response byte, either greater or less than. EG: >100 or <100
-fw                 Filter by amount of words in response. Comma separated list of word counts and ranges

INPUT OPTIONS:
-D                  DirSearch wordlist compatibility mode. Used in conjunction with -e flag. (default: false)
-e                  Comma separated list of extensions. Extends FUZZ keyword.
-ic                 Ignore wordlist comments (default: false)
-input-cmd          Command producing the input. --input-num is required when using this input method. Overrides -w.
-input-num          Number of inputs to test. Used in conjunction with --input-cmd. (default: 100)
-input-shell        Shell to be used for running command
-mode               Multi-wordlist operation mode. Available modes: clusterbomb, pitchfork, sniper (default: clusterbomb)
-request            File containing the raw http request
-request-proto      Protocol to use along with raw request (default: https)
-w                  Wordlist file path and (optional) keyword separated by colon. eg. '/path/to/wordlist:KEYWORD'

OUTPUT OPTIONS:
-debug-log          Write all of the internal logging to the specified file.
-o                  Write output to file
-od                 Directory path to store matched results to.
-of                 Output file format. Available formats: json, ejson, html, md, csv, ecsv (or, 'all' for all formats) (default: json)
-or                 Don't create the output file if we don't have results (default: false)

EXAMPLE USAGE:
Fuzz file paths from wordlist.txt, match all responses but filter out those with content-size 42.
Colored, verbose output.
ffuf -w wordlist.txt -u https://example.org/FUZZ -mc all -fs 42 -c -v

Fuzz Host-header, match HTTP 200 responses.
ffuf -w hosts.txt -u https://example.org/ -H "Host: FUZZ" -mc 200

Fuzz POST JSON data. Match all responses not containing text "error".
ffuf -w entries.txt -u https://example.org/ -X POST -H "Content-Type: application/json" \
-d '{"name": "FUZZ", "anotherkey": "anothervalue"}' -fr "error"

Fuzz multiple locations. Match only responses reflecting the value of "VAL" keyword. Colored.
ffuf -w params.txt:PARAM -w values.txt:VAL -u https://example.org/?PARAM=VAL -mr "VAL" -c

More information and examples: https://github.com/ffuf/ffuf
````

## Requirements

Kubernetes: `>=v1.11.0-0`

## Additional Chart Configurations
### Wordlist Configmap

ffuf needs a wordlist file. To introduce your wordlist file to your scanner pod, you have to create a `configMap`:
```bash
kubectl create configmap --from-file /path/to/my/wordlist.txt ffuf-config
```
Or you can use the secureCodeBox predefined (simple stupid) wordlist:
```bash
kubectl create configmap --from-file examples/wordlist-config-map/wordlist.txt ffuf-config
```
If you are in a namespace:
```bash
kubectl create configmap --from-file examples/wordlist-config-map/wordlist.txt ffuf-config -n integration-tests
```

Now just mount that config in your scan and select the mounted path for your ffuf `-w` option.

<table>
    <thead>
        <th>Key</th>
        <th>Type</th>
        <th class="default-column">Default</th>
        <th>Description</th>
    </thead>
    <tbody>
        <tr>
            <td>cascadingRules.enabled</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Enables or disables the installation of the default cascading rules for this scanner</td>
        </tr>
        <tr>
            <td>parser.affinity</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Optional affinity settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/)</td>
        </tr>
        <tr>
            <td>parser.env</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional environment variables mapped into each parseJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)</td>
        </tr>
        <tr>
            <td>parser.image.pullPolicy</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"IfNotPresent"`
</pre></td>
            <td>Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images</td>
        </tr>
        <tr>
            <td>parser.image.repository</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"docker.io/securecodebox/parser-ffuf"`
</pre></td>
            <td>Parser image repository</td>
        </tr>
        <tr>
            <td>parser.image.tag</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    defaults to the charts version
</pre></td>
            <td>Parser image tag</td>
        </tr>
        <tr>
            <td>parser.scopeLimiterAliases</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Optional finding aliases to be used in the scopeLimiter.</td>
        </tr>
        <tr>
            <td>parser.tolerations</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional tolerations settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)</td>
        </tr>
        <tr>
            <td>parser.ttlSecondsAfterFinished</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>seconds after which the Kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/</td>
        </tr>
        <tr>
            <td>scanner.activeDeadlineSeconds</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>There are situations where you want to fail a scan Job after some amount of time. To do so, set activeDeadlineSeconds to define an active deadline (in seconds) when considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-termination-and-cleanup)</td>
        </tr>
        <tr>
            <td>scanner.affinity</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Optional affinity settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/)</td>
        </tr>
        <tr>
            <td>scanner.backoffLimit</td>
            <td>int</td>
            <td class="default-column">
<pre lang="yaml">

   
</pre></td>
            <td>There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy)</td>
        </tr>
        <tr>
            <td>scanner.env</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)</td>
        </tr>
        <tr>
            <td>scanner.extraContainers</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)</td>
        </tr>
        <tr>
            <td>scanner.extraVolumeMounts</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/)</td>
        </tr>
        <tr>
            <td>scanner.extraVolumes</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/)</td>
        </tr>
        <tr>
            <td>scanner.image.pullPolicy</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"IfNotPresent"`
</pre></td>
            <td>Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images</td>
        </tr>
        <tr>
            <td>scanner.image.repository</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"docker.io/securecodebox/scanner-ffuf"`
</pre></td>
            <td>Container Image to run the scan</td>
        </tr>
        <tr>
            <td>scanner.image.tag</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>defaults to the charts appVersion</td>
        </tr>
        <tr>
            <td>scanner.nameAppend</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>append a string to the default scantype name.</td>
        </tr>
        <tr>
            <td>scanner.resources</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/)</td>
        </tr>
        <tr>
            <td>scanner.securityContext</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":true,"runAsNonRoot":true}`
</pre></td>
            <td>Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)</td>
        </tr>
        <tr>
            <td>scanner.securityContext.allowPrivilegeEscalation</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Ensure that users privileges cannot be escalated</td>
        </tr>
        <tr>
            <td>scanner.securityContext.capabilities.drop[0]</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"all"`
</pre></td>
            <td>This drops all linux privileges from the container.</td>
        </tr>
        <tr>
            <td>scanner.securityContext.privileged</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Ensures that the scanner container is not run in privileged mode</td>
        </tr>
        <tr>
            <td>scanner.securityContext.readOnlyRootFilesystem</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>Prevents write access to the containers file system</td>
        </tr>
        <tr>
            <td>scanner.securityContext.runAsNonRoot</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>Enforces that the scanner image is run as a non root user</td>
        </tr>
        <tr>
            <td>scanner.suspend</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>if set to true the scan job will be suspended after creation. You can then resume the job using `kubectl resume <jobname>` or using a job scheduler like kueue</td>
        </tr>
        <tr>
            <td>scanner.tolerations</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional tolerations settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)</td>
        </tr>
        <tr>
            <td>scanner.ttlSecondsAfterFinished</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>seconds after which the Kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/</td>
        </tr>
    </tbody>
</table>

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://www.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE

