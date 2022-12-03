---
title: "Angularjs CSTI Scanner"
category: "scanner"
type: "WebApplication"
state: "released"
appVersion: "null"
usecase: "Find AngularJS websites vulnerable to template injections"
---

![acstis logo](https://rawgit.com/tijme/angularjs-csti-scanner/master/.github/logo.svg?pypi=png.from.svg)

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

## What is AngularJS Client-Side Template Injection Scanner (acstis)?

The AngularJS Client-Side Template Injection Scanner (acstis) is an open source scanner for
finding possible template injection vulnerabilities on websites using AngularJS.

For more information visit the projects [GitHub site][acstis-github].

## Deployment
The angularjs-csti-scanner chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install angularjs-csti-scanner secureCodeBox/angularjs-csti-scanner
```

## Scanner Configuration

The only mandatory parameter is:
- `-d`: The url to scan (e.g. https://angularjs.org/).

Optional arguments:

```bash
-c, --crawl                                                                      use the crawler to scan all the entire domain
-vp, --verify-payload                                                            use a javascript engine to verify if the payload was executed (otherwise false positives may occur)
-av ANGULAR_VERSION, --angular-version ANGULAR_VERSION                           manually pass the angular version (e.g. 1.4.2) if the automatic check doesn't work
-vrl VULNERABLE_REQUESTS_LOG, --vulnerable-requests-log VULNERABLE_REQUESTS_LOG  log all vulnerable requests to this file (e.g. /var/logs/acstis.log or urls.log)
-siv, --stop-if-vulnerable                                                       (crawler option) stop scanning if a vulnerability was found
-pmm, --protocol-must-match                                                      (crawler option) only scan pages with the same protocol as the starting point (e.g. only https)
-sos, --scan-other-subdomains                                                    (crawler option) also scan pages that have another subdomain than the starting point
-soh, --scan-other-hostnames                                                     (crawler option) also scan pages that have another hostname than the starting point
-sot, --scan-other-tlds                                                          (crawler option) also scan pages that have another tld than the starting point
-md MAX_DEPTH, --max-depth MAX_DEPTH                                             (crawler option) the maximum search depth (default is unlimited)
-mt MAX_THREADS, --max-threads MAX_THREADS                                       (crawler option) the maximum amount of simultaneous threads to use (default is 20)
-iic, --ignore-invalid-certificates                                              (crawler option) ignore invalid ssl certificates
```

**Do not** override the option `-vrl` or `--vulnerable-requests-log`. It is already configured for automatic findings parsing.

## Requirements

Kubernetes: `>=v1.11.0-0`

## Additional Chart Configurations
### Request configuration

Because *acstis* does not provide command line arguments for configuring the sent requests,
you have to mount a config map into the scan container on a specific location. Your additional config map should be
 mounted to `/home/angularjscsti/acstis/config/acstis-config.py`. For example create a config map:

 ```bash
kubectl create configmap --from-file /path/to/my/acstis-config.py acstis-config
```

Then, mount it into the container:

```yaml
    volumes:
     - name: "acstis-config"
       configMap:
         name: "acstis-config"
    volumeMounts:
     - name: "acstis-config"
       mountPath: "/home/angularjscsti/acstis/config/"
```

#### Configuration options in *acstis-config.py*

Add the following snippets to the *acstis-config.py* file to enable further options.
The options are python code which will be injected into the *acstis* script before execution.

**Basic Authentication**
```text
options.identity.auth = HTTPBasicAuth("username", "password")
```

**Cookies**
```text
options.identity.cookies.set(name='tasty_cookie', value='yum', domain='finnwea.com', path='/cookies')
options.identity.cookies.set(name='gross_cookie', value='blech', domain='finnwea.com', path='/elsewhere')
```

**Headers**
```text
options.identity.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
    "Authorization": "Bearer ey3jafoe.2jefo..."
})
```

**Proxies**
```text
options.identity.proxies = {
    # No authentication
    # 'http': 'http://host:port',
    # 'https': 'http://host:port',

    # Basic authentication
    # 'http': 'http://user:pass@host:port',
    # 'https': 'https://user:pass@host:port',

    # SOCKS
    'http': 'socks5://user:pass@host:port',
    'https': 'socks5://user:pass@host:port'
}
```

**Scope options**
```text
options.scope.protocol_must_match = False

options.scope.subdomain_must_match = True

options.scope.hostname_must_match = True

options.scope.tld_must_match = True

options.scope.max_depth = None

options.scope.request_methods = [
    Request.METHOD_GET,
    Request.METHOD_POST,
    Request.METHOD_PUT,
    Request.METHOD_DELETE,
    Request.METHOD_OPTIONS,
    Request.METHOD_HEAD
]
```

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascadingRules.enabled | bool | `false` | Enables or disables the installation of the default cascading rules for this scanner |
| imagePullSecrets | list | `[]` | Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/) |
| parser.affinity | object | `{}` | Optional affinity settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| parser.env | list | `[]` | Optional environment variables mapped into each parseJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| parser.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| parser.image.repository | string | `"docker.io/securecodebox/parser-angularjs-csti-scanner"` | Parser image repository |
| parser.image.tag | string | defaults to the charts version | Parser image tag |
| parser.resources | object | { requests: { cpu: "200m", memory: "100Mi" }, limits: { cpu: "400m", memory: "200Mi" } } | Optional resources lets you control resource limits and requests for the parser container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ |
| parser.scopeLimiterAliases | object | `{}` | Optional finding aliases to be used in the scopeLimiter. |
| parser.tolerations | list | `[]` | Optional tolerations settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| parser.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| scanner.activeDeadlineSeconds | string | `nil` | There are situations where you want to fail a scan Job after some amount of time. To do so, set activeDeadlineSeconds to define an active deadline (in seconds) when considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-termination-and-cleanup) |
| scanner.affinity | object | `{}` | Optional affinity settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| scanner.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scanner.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scanner.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scanner.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| scanner.image.repository | string | `"docker.io/securecodebox/scanner-angularjs-csti-scanner"` | Container Image to run the scan |
| scanner.image.tag | string | `nil` | defaults to the charts appVersion |
| scanner.nameAppend | string | `nil` | append a string to the default scantype name. |
| scanner.podSecurityContext | object | `{}` | Optional securityContext set on scanner pod (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":false,"runAsNonRoot":true}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.securityContext.allowPrivilegeEscalation | bool | `false` | Ensure that users privileges cannot be escalated |
| scanner.securityContext.capabilities.drop[0] | string | `"all"` | This drops all linux privileges from the container. |
| scanner.securityContext.privileged | bool | `false` | Ensures that the scanner container is not run in privileged mode |
| scanner.securityContext.readOnlyRootFilesystem | bool | `false` | Prevents write access to the containers file system |
| scanner.securityContext.runAsNonRoot | bool | `true` | Enforces that the scanner image is run as a non root user |
| scanner.tolerations | list | `[]` | Optional tolerations settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| scanner.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |

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
[acstis-github]: https://github.com/tijme/angularjs-csti-scanner
