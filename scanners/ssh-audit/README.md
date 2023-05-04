---
title: "SSH"
category: "scanner"
type: "SSH"
state: "released"
appVersion: "v2.9.0"
usecase: "SSH Configuration and Policy Scanner"
---

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

## What is SSH-audit?

ssh-audit is a tool for ssh server & client configuration auditing.

To learn more about the ssh-audit scanner itself visit [ssh-audit GitHub].

## Deployment
The ssh-audit chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install ssh-audit secureCodeBox/ssh-audit
```

## Scanner Configuration

The following security scan configuration example are based on the [ssh-audit Documentation], please take a look at the original documentation for more configuration examples.

```bash
usage: ssh-audit.py [options] <host>

   -h,  --help             print this help
   -1,  --ssh1             force ssh version 1 only
   -2,  --ssh2             force ssh version 2 only
   -4,  --ipv4             enable IPv4 (order of precedence)
   -6,  --ipv6             enable IPv6 (order of precedence)
   -b,  --batch            batch output
   -c,  --client-audit     starts a server on port 2222 to audit client
                               software config (use -p to change port;
                               use -t to change timeout)
   -d,  --debug            Enable debug output.
   -g,  --gex-test=<x[,y,...]>  dh gex modulus size test
                   <min1:pref1:max1[,min2:pref2:max2,...]>
                   <x-y[:step]>
   -j,  --json             JSON output (use -jj to enable indents)
   -l,  --level=<level>    minimum output level (info|warn|fail)
   -L,  --list-policies    list all the official, built-in policies
        --lookup=<alg1,alg2,...>    looks up an algorithm(s) without
                                    connecting to a server
   -m,  --manual           print the man page (Windows only)
   -M,  --make-policy=<policy.txt>  creates a policy based on the target server
                                    (i.e.: the target server has the ideal
                                    configuration that other servers should
                                    adhere to)
   -n,  --no-colors        disable colors
   -p,  --port=<port>      port to connect
   -P,  --policy=<"policy name" | policy.txt>  run a policy test using the
                                                   specified policy
   -t,  --timeout=<secs>   timeout (in seconds) for connection and reading
                               (default: 5)
   -T,  --targets=<hosts.txt>  a file containing a list of target hosts (one
                                   per line, format HOST[:PORT])
        --threads=<threads>    number of threads to use when scanning multiple
                                   targets (-T/--targets) (default: 32)
   -v,  --verbose          verbose output
```

## Requirements

Kubernetes: `>=v1.11.0-0`

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascadingRules.enabled | bool | `true` |  |
| env | list | `[]` |  |
| extraContainers | list | `[]` |  |
| extraVolumeMounts | list | `[]` |  |
| extraVolumes | list | `[]` |  |
| parser.backoffLimit | int | `3` |  |
| parser.env | list | `[]` |  |
| parser.image.repository | string | `nil` |  |
| parser.image.tag | string | `nil` |  |
| parser.scopeLimiterAliases | object | `{}` |  |
| parser.ttlSecondsAfterFinished | string | `nil` |  |
| scanner.backoffLimit | int | `3` |  |
| scanner.image.repository | string | `"docker.io/sam/ssh"` |  |
| scanner.image.tag | string | `"0.1"` |  |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.ttlSecondsAfterFinished | string | `nil` |  |
| securityContext.allowPrivilegeEscalation | bool | `false` |  |
| securityContext.capabilities.drop[0] | string | `"all"` |  |
| securityContext.privileged | bool | `false` |  |
| securityContext.readOnlyRootFilesystem | bool | `true` |  |
| securityContext.runAsNonRoot | bool | `true` |  |

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
[ssh-audit GitHub]: https://github.com/jtesta/ssh-audit
[ssh-audit Documentation]: https://github.com/jtesta/ssh-audit#usage
