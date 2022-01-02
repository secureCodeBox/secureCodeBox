---
title: "SSLyze"
category: "scanner"
type: "SSL"
state: "released"
appVersion: "v5.0.2"
usecase: "SSL/TLS Configuration Scanner"
---

<!--
SPDX-FileCopyrightText: 2021 iteratec GmbH

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
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Incubator Project" src="https://img.shields.io/badge/OWASP-Incubator%20Project-365EAA"/></a>
  <a href="https://artifacthub.io/packages/search?repo=securecodebox"><img alt="Artifact HUB" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/securecodebox"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/secureCodeBox/secureCodeBox?logo=GitHub"/></a>
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"/></a>
</p>

## What is SSLyze?

[SSLyze][SSLyze Documentation] is a Python library and a CLI tool that can analyze the SSL configuration of a server by connecting to it. It is designed to be fast and comprehensive, and should help organizations and testers identify mis-configurations affecting their SSL/TLS servers. To learn more about the SSLyze scanner itself visit or [SSLyze GitHub].

## Deployment
The sslyze chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install sslyze secureCodeBox/sslyze
```

## Scanner Configuration

The following security scan configuration example are based on the [SSLyze Documentation], please take a look at the original documentation for more configuration examples.

The command line interface can be used to easily run server scans: `sslyze --regular www.example.com`

```bash
Usage: sslyze [options] target1.com target2.com:443 target3.com:443{ip} etc...

Options:
  --version             show program's version number and exit
  -h, --help            show this help message and exit
  --regular             Regular HTTPS scan; shortcut for --sslv2 --sslv3
                        --tlsv1 --tlsv1_1 --tlsv1_2 --tlsv1_3 --reneg --resum
                        --certinfo --hide_rejected_ciphers --compression
                        --heartbleed --openssl_ccs --fallback --robot

  Trust stores options:
    --update_trust_stores
                        Update the default trust stores used by SSLyze. The
                        latest stores will be downloaded from https://github.c
                        om/nabla-c0d3/trust_stores_observatory. This option is
                        meant to be used separately, and will silence any
                        other command line option supplied to SSLyze.

  Client certificate options:
    --cert=CERT         Client certificate chain filename. The certificates
                        must be in PEM format and must be sorted starting with
                        the subject's client certificate, followed by
                        intermediate CA certificates if applicable.
    --key=KEY           Client private key filename.
    --keyform=KEYFORM   Client private key format. DER or PEM (default).
    --pass=KEYPASS      Client private key passphrase.

  Input and output options:
    --json_out=JSON_FILE
                        Write the scan results as a JSON document to the file
                        JSON_FILE. If JSON_FILE is set to "-", the JSON output
                        will instead be printed to stdout. The resulting JSON
                        file is a serialized version of the ScanResult objects
                        described in SSLyze's Python API: the nodes and
                        attributes will be the same. See https://nabla-c0d3.gi
                        thub.io/sslyze/documentation/available-scan-
                        commands.html for more details.
    --targets_in=TARGETS_IN
                        Read the list of targets to scan from the file
                        TARGETS_IN. It should contain one host:port per line.
    --quiet             Do not output anything to stdout; useful when using
                        --json_out.

  Connectivity options:
    --slow_connection   Greatly reduce the number of concurrent connections
                        initiated by SSLyze. This will make the scans slower
                        but more reliable if the connection between your host
                        and the server is slow, or if the server cannot handle
                        many concurrent connections. Enable this option if you
                        are getting a lot of timeouts or errors.
    --https_tunnel=HTTPS_TUNNEL
                        Tunnel all traffic to the target server(s) through an
                        HTTP CONNECT proxy. HTTP_TUNNEL should be the proxy's
                        URL: 'http://USER:PW@HOST:PORT/'. For proxies
                        requiring authentication, only Basic Authentication is
                        supported.
    --starttls=STARTTLS
                        Perform a StartTLS handshake when connecting to the
                        target server(s). StartTLS should be one of: auto,
                        smtp, xmpp, xmpp_server, pop3, imap, ftp, ldap, rdp,
                        postgres. The 'auto' option will cause SSLyze to
                        deduce the protocol (ftp, imap, etc.) from the
                        supplied port number, for each target servers.
    --xmpp_to=XMPP_TO   Optional setting for STARTTLS XMPP. XMPP_TO should be
                        the hostname to be put in the 'to' attribute of the
                        XMPP stream. Default is the server's hostname.
    --sni=SNI           Use Server Name Indication to specify the hostname to
                        connect to.  Will only affect TLS 1.0+ connections.

  Scan commands:
    --tlsv1_1           Test a server for TLS 1.1 support.
    --tlsv1_2           Test a server for TLS 1.2 support.
    --robot             Test a server for the ROBOT vulnerability.
    --reneg             Test a server for for insecure TLS renegotiation and
                        client-initiated renegotiation.
    --early_data        Test a server for TLS 1.3 early data support.
    --fallback          Test a server for the TLS_FALLBACK_SCSV mechanism to
                        prevent downgrade attacks.
    --tlsv1_3           Test a server for TLS 1.3 support.
    --certinfo          Retrieve and analyze a server's certificate(s) to
                        verify its validity.
    --certinfo_ca_file=CERTINFO_CA_FILE
                        Path to a file containing root certificates in PEM
                        format that will be used to verify the validity of the
                        server's certificate.
    --heartbleed        Test a server for the OpenSSL Heartbleed
                        vulnerability.
    --resum_rate        Measure a server's session resumption rate when
                        attempting 100 resumptions using session IDs.
    --resum             Test a server for session resumption support using
                        session IDs and TLS tickets.
    --http_headers      Test a server for the presence of security-related
                        HTTP headers.
    --sslv2             Test a server for SSL 2.0 support.
    --tlsv1             Test a server for TLS 1.0 support.
    --sslv3             Test a server for SSL 3.0 support.
    --compression       Test a server for TLS compression support, which can
                        be leveraged to perform a CRIME attack.
    --openssl_ccs       Test a server for the OpenSSL CCS Injection
                        vulnerability (CVE-2014-0224).
```

## Requirements

Kubernetes: `>=v1.11.0-0`

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascadingRules.enabled | bool | `true` | Enables or disables the installation of the default cascading rules for this scanner |
| parser.affinity | object | `{}` | Optional affinity settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| parser.env | list | `[]` | Optional environment variables mapped into each parseJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| parser.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| parser.image.repository | string | `"docker.io/securecodebox/parser-sslyze"` | Parser image repository |
| parser.image.tag | string | defaults to the charts version | Parser image tag |
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
| scanner.image.repository | string | `"nablac0d3/sslyze"` | Container Image to run the scan |
| scanner.image.tag | string | `"latest@sha256:ff2c5c626401b1961736a5b2ae6e35a41d213e8b2712102100abf5ee46dcca71"` | defaults to the charts appVersion |
| scanner.nameAppend | string | `nil` | append a string to the default scantype name. |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":true,"runAsNonRoot":false}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.securityContext.allowPrivilegeEscalation | bool | `false` | Ensure that users privileges cannot be escalated |
| scanner.securityContext.capabilities.drop[0] | string | `"all"` | This drops all linux privileges from the container. |
| scanner.securityContext.privileged | bool | `false` | Ensures that the scanner container is not run in privileged mode |
| scanner.securityContext.readOnlyRootFilesystem | bool | `true` | Prevents write access to the containers file system |
| scanner.securityContext.runAsNonRoot | bool | `false` | Enforces that the scanner image is run as a non root user |
| scanner.tolerations | list | `[]` | Optional tolerations settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| scanner.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://docs.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
[SSLyze GitHub]: https://github.com/nabla-c0d3/sslyze
[SSLyze Documentation]: https://nabla-c0d3.github.io/sslyze/documentation/
