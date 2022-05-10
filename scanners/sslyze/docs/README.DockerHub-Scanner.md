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
  <img alt="secureCodeBox Logo" src="https://docs.securecodebox.io/img/Logo_Color.svg" width="250px"/>
</p>

_[OWASP secureCodeBox][scb-github]_ is an automated and scalable open source solution that can be used to integrate various *security vulnerability scanners* with a simple and lightweight interface. The _secureCodeBox_ mission is to support *DevSecOps* Teams to make it easy to automate security vulnerability testing in different scenarios.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The secureCodeBox project is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. It is also possible to start the different integrated security vulnerability scanners based on a docker infrastructure.

### Quickstart with secureCodeBox on kubernetes

You can find resources to help you get started on our [documentation website](https://docs.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://docs.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://docs.securecodebox.io/docs/getting-started/first-scans) with it.

## Supported Tags
- `latest`  (represents the latest stable release build)
- tagged releases, e.g. `3.0.0`, `2.9.0`, `2.8.0`, `2.7.0`

## How to use this image
This `scanner` image is intended to work in combination with the corresponding `parser` image to parse the scanner `findings` to generic secureCodeBox results. For more information details please take a look at the [project page][scb-docs] or [documentation page][https://docs.securecodebox.io/docs/scanners/SSLyze].

```bash
docker pull securecodebox/scanner-sslyze
```

## What is SSLyze?

[SSLyze][SSLyze Documentation] is a Python library and a CLI tool that can analyze the SSL configuration of a server by connecting to it. It is designed to be fast and comprehensive, and should help organizations and testers identify mis-configurations affecting their SSL/TLS servers. To learn more about the SSLyze scanner itself visit or [SSLyze GitHub].

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
[scb-docs]: https://docs.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
[SSLyze GitHub]: https://github.com/nabla-c0d3/sslyze
[SSLyze Documentation]: https://nabla-c0d3.github.io/sslyze/documentation/
