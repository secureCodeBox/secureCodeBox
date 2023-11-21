---
title: "SSLyze"
category: "scanner"
type: "SSL"
state: "released"
appVersion: "5.2.0"
usecase: "SSL/TLS Configuration Scanner"
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

The command line interface can be used to easily run server scans: `sslyze --mozilla_config=intermediate www.example.com`

```bash
Usage: python -m sslyze [options] target1.com target2.com:443 target3.com:443{ip} etc...

Options:
  -h, --help            show this help message and exit
  --mozilla_config {modern,intermediate,old}
                        Shortcut to queue various scan commands needed to check the server's TLS configurations against one of Mozilla's recommended TLS configuration. Set to
                        "intermediate" by default.

Trust stores options:
  --update_trust_stores
                        Update the default trust stores used by SSLyze. The
                        latest stores will be downloaded from https://github.c
                        om/nabla-c0d3/trust_stores_observatory. This option is
                        meant to be used separately, and will silence any
                        other command line option supplied to SSLyze.

Client certificate options:
  --cert CERTIFICATE_FILE
                        Client certificate chain filename. The certificates
                        must be in PEM format and must be sorted starting with
                        the subject's client certificate, followed by
                        intermediate CA certificates if applicable.
  --key KEY_FILE        Client private key filename.
  --keyform KEY_FORMAT  Client private key format. DER or PEM (default).
  --pass PASSPHRASE     Client private key passphrase.

Input and output options:
  --json_out JSON_FILE  Write the scan results as a JSON document to the file
                        JSON_FILE. If JSON_FILE is set to '-', the JSON output
                         will instead be printed to stdout. The resulting JSON
                        file is a serialized version of the ScanResult objects
                         described in SSLyze's Python API: the nodes and
                        attributes will be the same. See https://nabla-c0d3.gi
                        thub.io/sslyze/documentation/available-scan-
                        commands.html for more details.
  --targets_in TARGET_FILE
                        Read the list of targets to scan from the file
                        TARGET_FILE. It should contain one host:port per line.
  --quiet               Do not output anything to stdout; useful when using
                      --json_out.

Connectivity options:
  --slow_connection     Greatly reduce the number of concurrent connections
                        initiated by SSLyze. This will make the scans slower
                        but more reliable if the connection between your host
                        and the server is slow, or if the server cannot handle
                        many concurrent connections. Enable this option if you
                        are getting a lot of timeouts or errors.
  --https_tunnel PROXY_SETTINGS
                        Tunnel all traffic to the target server(s) through an
                        HTTP CONNECT proxy. HTTP_TUNNEL should be the proxy's
                        URL: 'http://USER:PW@HOST:PORT/'. For proxies
                        requiring authentication, only Basic Authentication is
                        supported.
  --starttls PROTOCOL Perform a StartTLS handshake when connecting to the
                        target server(s). StartTLS should be one of: auto,
                        smtp, xmpp, xmpp_server, pop3, imap, ftp, ldap, rdp,
                        postgres. The 'auto' option will cause SSLyze to
                        deduce the protocol (ftp, imap, etc.) from the
                        supplied port number, for each target servers.
  --xmpp_to HOSTNAME   Optional setting for STARTTLS XMPP. XMPP_TO should be
                        the hostname to be put in the 'to' attribute of the
                        XMPP stream. Default is the server's hostname.
  --sni SERVER_NAME_INDICATION
                        Use Server Name Indication to specify the hostname to
                        connect to. Will only affect TLS 1.0+ connections.

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
    --certinfo_ca_file CERTINFO_CA_FILE
                        To be used with --certinfo. Path to a file containing
                        root certificates in PEM format that will be used to verify
                         the validity of the server's certificate.

    --heartbleed        Test a server for the OpenSSL Heartbleed
                        vulnerability.
    --resum             Test a server for TLS 1.2 session resumption support using

    --resum_attempts RESUM_ATTEMPTS
                        To be used with --resum. Number of session resumptions
                        (both with Session IDs and TLS Tickets) that SSLyze should attempt. The default value is 5, but a higher
                        value such as 100 can be used to get a more accurate measure of how often session resumption succeeds or fails with the server.
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
    --elliptic_curves   Test a server for supported elliptic curves.
```

## Requirements

Kubernetes: `>=v1.11.0-0`

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
            <td>imagePullSecrets</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/)</td>
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

    `"docker.io/securecodebox/parser-sslyze"`
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
            <td>parser.resources</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

   
</pre></td>
            <td>Optional resources lets you control resource limits and requests for the parser container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/</td>
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

    `"docker.io/securecodebox/scanner-sslyze"`
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
            <td>scanner.podSecurityContext</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Optional securityContext set on scanner pod (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)</td>
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

    `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":true,"runAsNonRoot":false}`
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

    `false`
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
[SSLyze GitHub]: https://github.com/nabla-c0d3/sslyze
[SSLyze Documentation]: https://nabla-c0d3.github.io/sslyze/documentation/
