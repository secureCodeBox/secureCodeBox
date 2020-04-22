# Syntax Definition for Combined Scans in SCBv2

secureCodeBox Core Development Team

Request for Comments: 1

Authors:

- Jannik Hollenbach (iteratec GmbH)
- Robert Seedorff (iteratec GmbH)
- Sven Strittmatter (iteratec GmbH)

## Status of this Memo

This document is a draft for the syntax and grammar definition used to declare combined scans in the next generation *secureCodeBox*. This is not a stable reference. It is necessary to discuss this topic in the community. Distribution of this memo is unlimited.

## Motivation

We are using *secureCodeBox* (further referenced as *SCB*) not only to scan a single web application for potential vulnerabilities. We also use *SCB* to scan whole networks to find potential vulnerable hosts. This approach relies on a concept of so called *combined scans*: We do one scan and feed the result into a subsequent scan. For example we scan for all hosts in a network with the *nmap scanner*, afterwords we scan all found IP addresses with the *nmap scanner* for open ports, and finally we scan these open ports with dedicated scanners like *SSLye*, *Nikto* etc.

We are now moving to a new architectural approach of the *secureCodeBox* based on [Kubernetes][k8s] and its [custom resources][k8s-custom-resources]. This aproach gives us the posibility to orchestrate scans as simple YAML files in Kubernetes. The whole descrition of this new architecture is out of scope of this document. It is described in the master thesis "INSERT TITLE HERE". This new architecture is further referenced as *SCBv2*.

This ground breaking architectural change requires also a new approach to define *combined scans*. They were implemented as plain Java code so far. This was quite inflexible: We needed to implement *combined scanners* for all possible combination of scanner (*nmap-nikto*, *nmap-sslyze*, *nmap-ssl* etc.). Also it is not very intuitive because you need a deep understanding of the underlying BPMN engine.

## Requirements Notation

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14][bcp-14] ([RFC2119](rfc-2119) [RFC8174][rfc-8174]) when, and only when, they appear in all capitals, as shown here.

## Introduction

Since the archietcure of *SCBv2* is based on Kubernetes the main artifact to describe the SCB orchestration is [YAML][yaml-spec]. So it seems natural to find an approach to define the *combined scans* also in YAML.

## Problem Description

In general we want to describe cascading scans like:

```text
+--------+             +--------+             +--------+
| scan 1 |-- result -->| scan 2 |-- result -->| scan 3 |
+--------+             +--------+       |     +--------+
                                        |
                                        |     +--------+
                                        +---->| scan 4 |
                                              +--------+
```

A cocnrete example:

```text
+----------------+         +-----------------+               +-----------+
|    <<nmap>>    |         |     <<nmap>>    |               |  <<SSL>>  |
| find all hosts |-- IP -->| find open ports |-- port 443 -->| check TLS |
+----------------+         +-----------------+      |        +-----------+
                                                    |
                                                    |        +-------------+
                                                    |        |  <<nikto>>  |
                                                    +------->| check HTTPd |
                                                             +-------------+
```

### List of Interesting Services for Scans

The [nmap service detection][nmap-detection] examines every foundopen port to detect what kind of service it is. For us interesting is this list:

- ssh
- ldap
- ftp
- shell
- https
- http
- http-proxy
- http-alt
- postgresql
- mysql
- soap

## Example Rules

### SSLyze Scan Rule

```yaml
apiVersion: "cascading.experimental.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "tls-scans"
spec:
  on:
    # AND logic
    # define an explicit "port" as finding and a given port number
    - category: "Open Port"
      attributes:
        port: 443
        service: "https"
    # define an "port service" finding (any port)
    - category: "Open Port"
      attributes:
        service: "https"
  scanSpec:
    name: "sslyze"
    parameters: ["--regular", "${attributes.hostname}"]
```

### ZAP Scan Rule

```yaml
apiVersion: "cascading.experimental.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "zap-scans"
spec:
  on:
    - category: "Open Port"
      attributes:
        service: "http"
  scanSpec:
    name: "zap"
    parameters: ["--zap-api-baseline", "${attributes.hostname}"]
```

### SQLMap

```yaml
apiVersion: "cascading.experimental.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "host-scan-database-check"
spec:
  on:
    # define an "port service" finding (any port)
    - category: "Open Port"
      attributes:
        service: "postgresql"
  scanSpec:
    name: "sqlmap"
    parameters: ["-t", "postgresql://${attributes.hostname}:${attributes.port}"]
```

### Nikto

#### Alternative 1

HTTP and HTTPS in one file.

```yaml
apiVersion: "cascading.experimental.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "host-scan-http"
spec:
  on:
    # define an "port service" finding (any port)
    - category: "Open Port"
      attributes:
        service: "http"
    - category: "Open Port"
      attributes:
        service: "https"
  scanSpec:
    name: "nikto"
    parameters: ["-t", "${attributes.service:-http}://${attributes.hostname}"]
```

#### Alternative 2

HTTP and HTTPS in two files due to `https`/`http` in `scanSpec.parameters`.

```yaml
apiVersion: "cascading.experimental.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "host-scans-http"
spec:
  on:
    - category: "Open Port"
      attributes:
        service: "http"
  scanSpec:
    name: "nitko"
    parameters: ["-t", "http://${attributes.hostname}"]
---
apiVersion: "cascading.experimental.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "host-scans-https"
spec:
  on:
    - category: "Open Port"
      attributes:
        service:
          equals: "host-scan-https"
    - category: "Open Port"
      attributes:
        service:
          regex: "^host-.*-https"
    - category: "Open Port"
      attributes: # Alternative RegEx
        service: "/^host-.*-https/"
    - category: "Open Port"
      attributes:
        service:
          contains: "scan"
  scanSpec:
    name: "nitko"
    parameters: ["-t", "https://${attributes.hostname}"]
```

## a complete IP Range Scan Example

```yaml
apiVersion: "execution.experimental.securecodebox.io/v1"
kind: Scan
metadata:
  name: "portscan-hamburg-full"
  label:
    office: hamburg
    vlan: complete
spec:
  cascades:
    enabled: true
    allowedCascades:
      - tls-scans # SSL Tests
      - host-scans # Nikto alternative 1
      - host-scans-https # Nikto alternative 2.1
      - host-scans-http # Nikto alternative 2.2
    disallowedCascades:
      - zap-scans # ZAP HTTP WebApp
  scanSpec:
    name: "nmap"
    parameters: ["-sV", "192.168.188.0/24"]
```

[bcp-14]:               https://tools.ietf.org/html/bcp14
[k8s]:                  https://kubernetes.io/
[k8s-custom-resources]: https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/
[nmap-detection]:       https://nmap.org/book/man-version-detection.html
[rfc-2119]:             https://tools.ietf.org/html/rfc2119
[rfc-8174]:             https://tools.ietf.org/html/rfc8174
[yaml-spec]:            https://github.com/yaml/yaml-spec