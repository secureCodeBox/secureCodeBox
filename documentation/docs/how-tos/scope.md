---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Enforcing Engagement Scope"
description: "How to limit CascadingScans"
sidebar_position: 7
---

## Introduction

In this step-by-step tutorial, we will go through all the required stages to set up engagement scope enforcement with secureCodeBox.
In this example, we are going to set up Amass and Nmap and run a scan with rules set-up so that we don't scan domains which are out-of-scope.

## Setup

For the sake of the tutorial, we assume that you have your Kubernetes cluster already up and running and that we can work in your default namespace.
If not, check out the [installation](/docs/getting-started/installation/) for more information.
We also assume that you have the latest version of cascading scans installed.

We will start by installing Amass and Nmap:

```bash
helm upgrade --install amass secureCodeBox/amass
Release "amass" does not exist. Installing it now.
[...]
helm upgrade --install nmap secureCodeBox/nmap
Release "nmap" does not exist. Installing it now.
[...]
```

## Start Scan With Scope Limit

Next, we can start creating our scan definition.
Let's assume that we would like amass to scan `nmap.org` for subdomains, but we would only like to run nmap on `scanme.nmap.org`.
In the example below, we only cascade if our `scope.cascading.securecodebox.io/domain` equals `{{attributes.name}}`.

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "amass-scan"
  annotations:
    scope.cascading.securecodebox.io/domain: "scanme.nmap.org"
spec:
  cascades:
    scopeLimiter:
      allOf:
        - key: "scope.cascading.securecodebox.io/domain"
          operator: "In"
          values: ["{{attributes.name}}"]
  scanType: "amass"
  parameters:
    - "-d"
    - "nmap.org"
```

:::info
See the [CRD specification](/docs/api/crds/scan#scopelimiter-optional) for the specific syntax and allowed values.
:::

Running this scan results in the following state:

```shell
$ kubectl get scans
amass-scan                      amass   Done    65
nmap-scan-nmap-hostscan-86f2m   nmap    Done    6
$ kubectl get pods
cascading-scans-amass-scan-8cssx--1-hh2w6                      0/1     Completed   0          2m51s
cascading-scans-nmap-scan-nmap-hostscan-86f2m-4mljv--1-7zgm2   0/1     Completed   0          2m23s
parse-amass-scan-zfhxg--1-shwkj                                0/1     Completed   0          2m54s
parse-nmap-scan-nmap-hostscan-86f2m-d6jh6--1-ztgls             0/1     Completed   0          2m26s
scan-amass-scan-79h5f--1-vk7v5                                 0/2     Completed   0          4m22s
scan-nmap-scan-nmap-hostscan-86f2m-54pkd--1-pfpp6              0/2     Completed   0          2m48s
```

As you can see, amass found 65 domain names, but only a single nmap scan was created.
In the cascading scans logs, you will see that lots of rules were not triggered as the domain was out of scope.

```shell
$ kubectl logs cascading-scans-amass-scan-8cssx--1-hh2w6
Starting hook for Scan "amass-scan"
Fetched 65 findings from the file storage
Fetching CascadingScans using LabelSelector: ""
Fetched 2 CascadingRules
Cascading Rule nmap-hostscan not triggered as scope limiter did not pass
[...]
```

## Handle Differences in Finding Formats

In many cases, you are cascading to more than one scanner.
Unfortunately, not every scanner has the same finding format, making a scope as defined above more tricky.

As an example, let's say you want to set up Nikto as a scanner.
This scanner cascades on Nmap's open port finding and uses `$.hostOrIp` to start the scan.
In some cases, nmap can return a hostname different to the original hostname, thus with scope rules we want to check for this.
Preferably, we would like to use the same rule as above.
Unfortunately, nmap gives its hostname in `attributes.hostname` instead of the defined `attributes.name` (Amass finding).
This results in the scope rule failing, and prevents Nikto from getting cascaded.

To solve this situation, you have two options:

### Option 1: Enable `validOnMissingRender`

Enabling this option causes all defined rules which contain unresolved mustache templates to result in `true`. You can use this if you're sure that Nmap returns the valid hostname.

Example:

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "amass-scan"
  annotations:
    scope.cascading.securecodebox.io/domain: "scanme.nmap.org"
spec:
  cascades:
    // highlight-next-line
    validOnMissingRender: true
    scopeLimiter:
      allOf:
        - key: "scope.cascading.securecodebox.io/domain"
          operator: "In"
          values: ["{{attributes.name}}"]
  scanType: "amass"
  parameters:
    - "-d"
    - "nmap.org"
```

### Option 2: Create a Hostname Alias for All Deployed Scanners

A more fool-proof solution is to ensure that the hostname field is available in the same place for each scanner.
When deploying your scanner, you can define `scopeLimiterAliases`.

```shell
$ helm upgrade --install amass secureCodeBox/amass \
 --set="parser.scopeLimiterAliases.hostname=\{\{attributes.name\}\}"
Release "amass" has been upgraded. Happy Helming!
[...]
$ helm upgrade --install nmap secureCodeBox/nmap \
 --set="parser.scopeLimiterAliases.hostname=\{\{attributes.hostname\}\}"
Release "nmap" has been upgraded. Happy Helming!
[...]
```

The aliases are added to the scanner's parse definition:

```yaml
apiVersion: execution.securecodebox.io/v1
kind: ParseDefinition
metadata:
  name: amass-jsonl
  namespace: default
spec:
  env: []
  image: docker.io/securecodebox/parser-amass:3.5.0
  imagePullPolicy: IfNotPresent
  scopeLimiterAliases:
    hostname: "{{attributes.name}}"
  ttlSecondsAfterFinished: null
```

To use your custom alias, you reference it with `$.hostname` in `scopeLimiter` in your scan definition.

```yaml
scopeLimiter:
  allOf:
    - key: "scope.cascading.securecodebox.io/domain"
      operator: "In"
      values: ["{{$.hostname}}"]
```

Running this scan inside the cluster runs Amass, Nmap, and Nikto as expected.

```shell
$ kubectl get scans
NAME                                              TYPE    STATE   FINDINGS
amass-scan                                        amass   Done    65
nikto-scan-nmap-hostscan-rhhqz-nikto-http-ps8cl   nikto   Done    6
nmap-scan-nmap-hostscan-rhhqz                     nmap    Done    6
```

:::caution
The scope limiter only applies to cascading scans.
If your initial scan is out-of-scope, it will still run.
:::
