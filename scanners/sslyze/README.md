---
title: "SSLyze"
category: "scanner"
type: "SSL"
state: "released"
appVersion: "3.0.8"
usecase: "SSL/TLS Configuration Scanner"
---

SSLyze is a Python library and a CLI tool that can analyze the SSL configuration of a server by connecting to it. It is designed to be fast and comprehensive, and should help organizations and testers identify mis-configurations affecting their SSL/TLS servers. To learn more about the SSLyze scanner itself visit or [SSLyze GitHub].

<!-- end -->

## Deployment

The SSLyze scanType can be deployed via helm:

```bash
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

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascadingRules.enabled | bool | `true` | Enables or disables the installation of the default cascading rules for this scanner |
| parser.image.repository | string | `"docker.io/securecodebox/parser-sslyze"` | Parser image repository |
| parser.image.tag | string | defaults to the charts version | Parser image tag |
| parser.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| scanner.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scanner.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scanner.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scanner.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.image.repository | string | `"nablac0d3/sslyze"` | Container Image to run the scan |
| scanner.image.tag | string | `"latest@sha256:ff2c5c626401b1961736a5b2ae6e35a41d213e8b2712102100abf5ee46dcca71"` | defaults to the charts appVersion |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.securityContext | object | `{}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |

[SSLyze GitHub]: https://github.com/nabla-c0d3/sslyze
[SSLyze Documentation]: https://nabla-c0d3.github.io/sslyze/documentation/
