---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Post-processing with Hooks"
description: "Automatically handle findings from your scans"
sidebar_position: 4
---

## Introduction

In this step-by-step tutorial, we will go through all the required stages to set up _hooks_ with the _secureCodeBox_. _Hooks_ can be used to perform post-processing on findings, for which we'll give a few examples.

## Setup

For the sake of the tutorial, we assume that you have your Kubernetes cluster already up and running and that we can work in your default namespace. If not, check out the [installation](/docs/getting-started/installation/) for more information.

We'll start by installing the nmap scanner:

```bash
helm upgrade --install nmap secureCodeBox/nmap
```

Next, we'll install two `update-field` _hooks_:

```bash
helm upgrade --install ufh1 secureCodeBox/update-field-hook --set attribute.name="category" --set attribute.value="first-hook"
helm upgrade --install ufh2 secureCodeBox/update-field-hook --set attribute.name="category" --set attribute.value="second-hook"
```

The first hook will update all _secureCodeBox_ findings such that the field `category` is set to the value `first-hook`. The second hook will set the same field to `second-hook`.
For a list of all available _secureCodeBox_ _hooks_, see [hooks](/docs/hooks/). There's no limit to the amount of _hooks_ you can install.

## Creating a scan

In practice, you are not required to specify anything to run your _hooks_.

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "nmap-example"
spec:
  scanType: "nmap"
  parameters:
    # We'll just scan for port 80 to speed up the scan.
    - "-p"
    - "80"
    # Scanning an example domain
    - "scanme.nmap.org"
```

For starting scans in Kubernetes, see [First Scans](/docs/getting-started/first-scans).

Once the scan has finished, you will see that two _hooks_ have run on your scan results with following command:

```bash
kubectl get pods
```

which will show something similar to this:

```bash
NAME                                                 READY   STATUS      RESTARTS   AGE
parse-nmap-example-5p964--1-ctgrv                    0/1     Completed   0          18s
scan-nmap-example-gg9kd--1-pjltd                     0/2     Completed   0          26s
ufh1-update-field-hook-nmap-example-p8pcb--1-vx25q   0/1     Completed   0          10s
ufh2-update-field-hook-nmap-example-drjmq--1-vzds2   0/1     Completed   0          3s
```

## Inspecting the findings

Looking at the findings, you will notice that the `category` field has been set to `second-hook`. This happens because the `ufh2` hook was executed after `ufh1`, discarding the value `first-hook` completely.

```json
[
  {
    "name": "Open Port: 80 (http)",
    "description": "Port 80 is open using tcp protocol.",
    // highlight-next-line
    "category": "second-hook",
    "location": "tcp://45.33.32.156:80",
    "osi_layer": "NETWORK",
    "severity": "INFORMATIONAL",
    "attributes": {
      ...
    },
    "id": "9fbda429-478d-4ce0-9a8d-1c4aef4d9b58"
  }
]
```

## Hook order

By default, hook order is specified according [this definition](/docs/api/crds/scan-completion-hook#priority-optional).

With the `hook.priority` field, you can further customize the order of _secureCodeBox_ _hooks_. The higher the priority of a hook, the earlier it will execute.
By default, all _hooks_ have a priority of `0`.

If we set `ufh2` hook's priority to `1`, we'll observe that it will execute before `ufh1`.

```bash
helm upgrade --install ufh2 secureCodeBox/update-field-hook --set hook.priority="1" --set attribute.name="category" --set attribute.value="second-hook"
```

```bash
kubectl get scancompletionhooks.execution.securecodebox.io
```

```bash
NAME                     TYPE           PRIORITY   IMAGE
ufh1-update-field-hook   ReadAndWrite   0          docker.io/securecodebox/hook-update-field:3.3.1
ufh2-update-field-hook   ReadAndWrite   1          docker.io/securecodebox/hook-update-field:3.3.1
```

Start, the scan and observe orders:

```bash
kubectl get pods                                                                                                kube minikube
```

```bash
NAME                                                 READY   STATUS      RESTARTS   AGE
parse-nmap-example-lrtcl--1-57n9t                    0/1     Completed   0          36s
scan-nmap-example-7s2t8--1-gbr6b                     0/2     Completed   0          39s
ufh1-update-field-hook-nmap-example-cvzw2--1-x4rcz   0/1     Completed   0          30s
ufh2-update-field-hook-nmap-example-mv57q--1-cvd4k   0/1     Completed   0          33s
```

Kubernetes sorts the list alphabetically, but notice the age of the jobs. Looking at the resulting finding, we can see the category is set to `first-hook`.

```json
[
  {
    "name": "Open Port: 80 (http)",
    "description": "Port 80 is open using tcp protocol.",
    // highlight-next-line
    "category": "first-hook",
    "location": "tcp://45.33.32.156:80",
    "osi_layer": "NETWORK",
    "severity": "INFORMATIONAL",
    "attributes": {
      ...
    },
    "id": "c15d1730-7ca8-4529-b55a-a3412832f309"
  }
]
```

## Hook selector

An alternative for more runtime _hook_ control is the scan's [HookSelector](/docs/api/crds/scan#hookselector-optional). This field allows you to define which _hooks_ to run for a scan.

In this case, we select all _hooks_, except _hooks_ with the label `ufh1`.

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "nmap-example"
spec:
  // highlight-start
  hookSelector:
    matchExpressions:
    - key: app.kubernetes.io/instance
      operator: NotIn
      values: [ "ufh1" ]
  // highlight-end
  scanType: "nmap"
  parameters:
    # We'll just scan for port 80 to speed up the scan.
    - "-p"
    - "80"
    # Scanning an example domain
    - "scanme.nmap.org"
```

You can find that only `ufh2` was executed.

```bash
kubectl get pods
```
                                                                                                                                                           
```bash
NAME                                                 READY   STATUS      RESTARTS   AGE
parse-nmap-example-shkrr--1-2hdt9                    0/1     Completed   0          10s
scan-nmap-example-7bllp--1-zx287                     0/2     Completed   0          13s
ufh2-update-field-hook-nmap-example-lmljv--1-smgp5   0/1     Completed   0          7s
```

The following labels are available by default:

- `app.kubernetes.io/instance`: the Helm release name (e.g. `ufh1`, `ufh2`)
- `app.kubernetes.io/name`: the Helm chart name (e.g. `update-field-hook`)
- `securecodebox.io/internal`: boolean field for whether this hook has internal usages in secureCodeBox (e.g. Cascading Scans hook)

You can also deploy _secureCodeBox_ _hooks_ with your own labels like so:

```bash
helm upgrade --install ufh2 secureCodeBox/update-field-hook --set hook.labels.securecodebox="rocks" --set attribute.name="category" --set attribute.value="second-hook"
```

This will add your custom label to the _secureCodeBox_ hook so that you can select is with `hookSelector`.

```yaml
apiVersion: execution.securecodebox.io/v1
kind: ScanCompletionHook
metadata:
  labels:
    app.kubernetes.io/instance: ufh2
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/name: update-field-hook
    helm.sh/chart: update-field-hook-3.3.1
    // highlight-next-line
    securecodebox: rocks
  name: ufh2-update-field-hook
  namespace: default
spec:
  env:
  - name: ATTRIBUTE_NAME
    value: category
  - name: ATTRIBUTE_VALUE
    value: second-hook
  image: docker.io/securecodebox/hook-update-field:3.3.1
  ttlSecondsAfterFinished: null
  type: ReadAndWrite
```

### Cascading scans

The `HookSelector` field is also available in Cascading Rules. This means that you can selectively disable _hooks_ for certain rules. Let's say that you're running _secureCodeBox_ with nmap, ncrack, and a [DefectDojo persistence provider](/docs/hooks/defectdojo). We can imagine that you'd prefer your ncrack passwords to not go directly to DefectDojo, so you could set up the cascading rule such that it filters the DefectDojo hook.

```yaml
apiVersion: "cascading.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "ncrack-ftp"
  labels:
    securecodebox.io/invasive: invasive
    securecodebox.io/intensive: high
    securecodebox.io/type: bruteforce
spec:
  matches:
    anyOf:
      - category: "Open Port"
        attributes:
          service: "ftp"
          state: open
  scanSpec:
    // highlight-start
    hookSelector:
      matchExpressions:
      - key: app.kubernetes.io/name
        operator: NotIn
        values: [ "persistence-defectdojo" ]
    // highlight-end
    scanType: "ncrack"
    parameters:
      - -v
      - -d10
      - -U
      - /ncrack/users.txt
      - -P
      - /ncrack/passwords.txt
      - -p
      - ftp:{{attributes.port}}
      - "{{$.hostOrIP}}"
```

Note that we use `app.kubernetes.io/name` here to filter all releases of the DefectDojo persistence provider.

:::caution
You can use [`scan.spec.cascading.inheritHookSelector`](/docs/api/crds/scan#cascades-optional) on your initial scan definition to pass `hookSelector` entries on to cascaded scans. Selectors defined in cascading rules will only apply to the scan triggered by the rule - if the results of that scan then trigger further cascading scans, the selectors defined in the cascading rule will be dropped and only those from the original scan are kept. Defining identical entries in both the Scan AND the Cascading Rule resource will lead to undefined behaviour.

See [#789](https://github.com/secureCodeBox/secureCodeBox/issues/789) for more details.
:::
