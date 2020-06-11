# Syntax Definition for Combined Scans in SCBv2

secureCodeBox Core Development Team

Request for Comments: 1

Authors:

- Jannik Hollenbach (iteratec GmbH)
- Robert Seedorff (iteratec GmbH)
- Sven Strittmatter (iteratec GmbH)

## Status of this Memo

This document is a draft for the syntax and grammar definition used to declare combined scans in the next generation _secureCodeBox_. This is not a stable reference. It is necessary to discuss this topic in the community. Distribution of this memo is unlimited.

## Motivation

We are using _secureCodeBox_ (further referenced as _SCB_) not only to scan a single web application for potential vulnerabilities. We also use _SCB_ to scan whole networks to find potential vulnerable hosts. This approach relies on a concept of so called _combined scans_: We do one scan and feed the result into a subsequent scan. For example we scan for all hosts in a network with the _nmap scanner_, afterwords we scan all found IP addresses with the _nmap scanner_ for open ports, and finally we scan these open ports with dedicated scanners like _SSLye_, _Nikto_ etc.

We are now moving to a new architectural approach of the _secureCodeBox_ based on [Kubernetes][k8s] and its [custom resources][k8s-custom-resources]. This aproach gives us the posibility to orchestrate scans as simple YAML files in Kubernetes. The whole descrition of this new architecture is out of scope of this document. It is described in the master thesis "Automatic Assessment of Applications Security Aspects running in Cloud Environments". This new architecture is further referenced as _SCBv2_.

This ground breaking architectural change requires also a new approach to define _combined scans_. They were implemented as plain Java code so far. This was quite inflexible: We needed to implement _combined scanners_ for all possible combination of scanner (_nmap-nikto_, _nmap-sslyze_, _nmap-ssl_ etc.). Also it is not very intuitive because you need a deep understanding of the underlying BPMN engine.

## Requirements Notation

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14][bcp-14] ([RFC2119](rfc-2119) [RFC8174][rfc-8174]) when, and only when, they appear in all capitals, as shown here.

## Introduction

Since the archietcure of _SCBv2_ is based on Kubernetes the main artifact to describe the SCB orchestration is [YAML][yaml-spec]. So it seems natural to find an approach to define the _combined scans_ also in YAML.

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

## Changelog

- Switched attribute `on` in `CascadingRule` to `matches`. On is a reserved keyword in yaml which gets implicitly converted to `"false"` when used without quationmarks as a key in yaml.
- Introduced a new layer under the `matches` attribute, to mark how these rules should be applied. Currently only supporting `anyOf`. This enabled to introduces other operators to add new behavior later, without introducing breaking changes.
- Switches selection mechanism for `CascadingRules` on `Scan` Objects to use kubernetes label selectors([documentation](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#api),[api reference](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.18/#labelselector-v1-meta)). The previous version matched on the names, which especially when using denylists can lead to problems when new `CascadingRules` were introduced but not included in the Blacklist. In the worst cases this can lead to invasive scanners being used against services where this is not permitted. The new label selector lets you block out classes of scanners (like all invasive scanner).

### List of Interesting Services for Scans

The [nmap service detection][nmap-detection] examines every found open port to detect what kind of service it is. For us interesting is this list:

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
  labels:
    # Described how "invasive" the scan is.
    # Possible values: "invasive" or "non-invasive"
    # CascadingRules are considered "invasive" when the Scan they start actively sends out packages with attack payloads.
    securecodebox.io/invasive: non-invasive
    # Described the intensiveness level on a scanning and computational resource level.
    # Possible values: "ligh", "medium", "intense"
    # CascadingRules are considered more "intensive" when the Scan they start consumes lots of computational resources like RAM, CPU, or Network
    securecodebox.io/intensive: light
spec:
  matches:
    # CascadingRule triggers if a finding matches at least one of the anyOf matchers
    # With the first version of this implementation only anyOf would be supported.
    # If this turns out to be lacking and other operators (like `allOf` can be introduced without breaking changes)
    anyOf:
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
    parameters: ["--regular", "{{attributes.hostname}}"]
```

### ZAP Scan Rule

```yaml
apiVersion: "cascading.experimental.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "zap-scans"
  labels:
    securecodebox.io/invasive: non-invasive
    securecodebox.io/intensive: medium
spec:
  matches:
    anyOf:
      - category: "Open Port"
        attributes:
          service: "http"
      - category: "Open Port"
        attributes:
          service: "https"
  scanSpec:
    name: "zap-baseline"
    parameters: ["-t", "{{location}}"]
```

### Ncrack (for Postgres)

```yaml
apiVersion: "cascading.experimental.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "postgres-credential-check"
  labels:
    securecodebox.io/invasive: invasive
    securecodebox.io/intensive: high
spec:
  matches:
    anyOf:
      # define an "port service" finding (any port)
      - category: "Open Port"
        attributes:
          service: "postgresql"
  scanSpec:
    name: "ncrack"
    parameters: ["postgresql://{{attributes.hostname}}:{{attributes.port}}"]
```

### Nikto

#### Alternative 1

HTTP and HTTPS in one file.

```yaml
apiVersion: "cascading.experimental.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "host-scan-http"
  labels:
    securecodebox.io/invasive: invasive
    securecodebox.io/intensive: medium
spec:
  matches:
    anyOf:
      # define an "port service" finding (any port)
      - category: "Open Port"
        attributes:
          service: "http"
      - category: "Open Port"
        attributes:
          service: "https"
  scanSpec:
    name: "nikto"
    parameters: ["-h", "{{attributes.service:}}://{{attributes.hostname}}"]
```

#### Alternative 2

HTTP and HTTPS in two files due to `https`/`http` in `scanSpec.parameters`.

```yaml
apiVersion: "cascading.experimental.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "host-scans-http"
  labels:
    securecodebox.io/invasive: invasive
    securecodebox.io/intensive: medium
spec:
  matches:
    anyOf:
      - category: "Open Port"
        attributes:
          service: "http"
  scanSpec:
    name: "nitko"
    parameters: ["-h", "http://{{attributes.hostname}}"]
---
apiVersion: "cascading.experimental.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "host-scans-https"
  labels:
    securecodebox.io/invasive: invasive
    securecodebox.io/intensive: medium
spec:
  matches:
    anyOf:
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
    parameters: ["-h", "https://${attributes.hostname}"]
```

## Using Cascading Rules

By default no cascading Rules will be used.

```yaml
# Nmap Scan without cascading rules
apiVersion: "execution.experimental.securecodebox.io/v1"
kind: Scan
metadata:
  name: "portscan-berlin-wifi"
  label:
    office: berlin
    vlan: wifi
spec:
  scanSpec:
    name: "nmap"
    parameters: ["-sV", "10.42.0.0/16"]
```

To enable cascading rules you need to specify a label selector to select the cascading rules you'd like

```yaml
apiVersion: "execution.experimental.securecodebox.io/v1"
kind: Scan
metadata:
  name: "portscan-berlin-wifi"
  label:
    office: berlin
    vlan: wifi
spec:
  cascades:
    matchLabels:
      # Uses all CascadingRules in the namespace which are labelled as "non-invasive" and a intensiveness level of "light"
      securecodebox.io/invasive: non-invasive
      securecodebox.io/intensive: light
  scanSpec:
    name: "nmap"
    parameters: ["-sV", "10.42.0.0/16"]
```

To implicitly enable all cascading rules (not-recommended) a empty label selector can be used

```yaml
apiVersion: "execution.experimental.securecodebox.io/v1"
kind: Scan
metadata:
  name: "portscan-berlin-wifi"
  label:
    office: berlin
    vlan: wifi
spec:
  cascades:
    # Uses all `CascadingRules` in the namespace
    matchLabels: {}
  scanSpec:
    name: "nmap"
    parameters: ["-sV", "10.42.0.0/16"]
```

[bcp-14]: https://tools.ietf.org/html/bcp14
[k8s]: https://kubernetes.io/
[k8s-custom-resources]: https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/
[nmap-detection]: https://nmap.org/book/man-version-detection.html
[rfc-2119]: https://tools.ietf.org/html/rfc2119
[rfc-8174]: https://tools.ietf.org/html/rfc8174
[yaml-spec]: https://github.com/yaml/yaml-spec
