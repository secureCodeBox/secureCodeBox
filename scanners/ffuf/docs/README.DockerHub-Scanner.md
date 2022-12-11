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

## What is OWASP secureCodeBox?

<p align="center">
  <img alt="secureCodeBox Logo" src="https://www.securecodebox.io/img/Logo_Color.svg" width="250px"/>
</p>

_[OWASP secureCodeBox][scb-github]_ is an automated and scalable open source solution that can be used to integrate various *security vulnerability scanners* with a simple and lightweight interface. The _secureCodeBox_ mission is to support *DevSecOps* Teams to make it easy to automate security vulnerability testing in different scenarios.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The secureCodeBox project is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. It is also possible to start the different integrated security vulnerability scanners based on a docker infrastructure.

### Quickstart with secureCodeBox on kubernetes

You can find resources to help you get started on our [documentation website](https://www.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://www.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://www.securecodebox.io/docs/getting-started/first-scans) with it.

## Supported Tags
- `latest`  (represents the latest stable release build)
- tagged releases, e.g. `v1.5.0`

## How to use this image
This `scanner` image is intended to work in combination with the corresponding `parser` image to parse the scanner `findings` to generic secureCodeBox results. For more information details please take a look at the [project page][scb-docs] or [documentation page][https://www.securecodebox.io/docs/scanners/ffuf].

```bash
docker pull securecodebox/scanner-ffuf
```

## What is ffuf?
FFuf is an open source (MIT license) fuzzing tool to detect content and elements on webservers and web applications.
People often use it as a web directory bruteforcer, but it is also capable of fuzzing much more than that (e.g. XSS, SQLi,...).

With this scanner the secure code box also installs SecLists wordlists.

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

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [Slack][scb-slack]
- [Twitter][scb-twitter]

secureCodeBox is an official [OWASP][scb-owasp] project.

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).

As for any pre-built image usage, it is the image user's responsibility to ensure that any use of this image complies with any relevant licenses for all software contained within.

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://www.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE

