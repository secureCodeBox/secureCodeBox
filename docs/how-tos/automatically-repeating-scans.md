---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Repeating Scans on a Schedule"
description: "Getting started with ScheduledScans"
sidebar_position: 1
---

## Introduction

In this step-by-step tutorial, we will go through all the required stages to set up a repeating scan with the secureCodeBox. A repeating scan will run automatically each time a time interval is passed. This time interval is set by the user. In this example, we are going to run a repeating typo3scan scan on the Typo3 local vulnerable demo-target (old-typo3). A repeating scan is useful, as it allows the developer to be aware of any new vulnerabilities that have been introduced in development.

## Setup

For the sake of the tutorial, we assume that you have your Kubernetes cluster already up and running and that we can work in your default namespace.
If not, check out the [installation](/docs/getting-started/installation/) for more information.

We will start by installing the typo3 scanner:

```bash
helm upgrade --install typo3scan secureCodeBox/typo3scan
```

And the Typo3 demo-target. This is only required if you don't already have a target you want to scan.

```bash
helm upgrade --install old-typo3 secureCodeBox/old-typo3
```

## Creating the Repeating Scan

After everything is set up properly, we can now configure the repeating scan.
We create a **scheduled-scan.yaml** where we define what the scan should do:

```yaml title="scheduled-scan.yaml"
apiVersion: "execution.securecodebox.io/v1"
kind: ScheduledScan
metadata:
  name: "old-typo3.demo-targets.svc.org-5min"
spec:
  interval: 5m
  scanSpec:
    scanType: "typo3scan"
    parameters:
      - "-d"
      - http://old-typo3.demo-targets.svc
      # Only show vulnerable extensions
      - "--vuln"
      # Set the number of threads to use for enumerating extensions at 10
      - "--threads"
      - "10"
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
```

We set the kind to `ScheduledScan`. This tells secureCodeBox to use the [ScheduledScan](/docs/api/crds/scheduled-scan) CRD. The interval here is set to 5 minutes (`5m`). This is only done to have quicker results for the example. If you're doing this on a real scan target, use a bigger time frame. It should be noted that hours (h) is the biggest unit that can be used. More info [here](/docs/api/crds/scheduled-scan#interval-required).

The `successfulJobsHistoryLimit` controls how many completed scans are supposed to be kept until the oldest one will be deleted. And the `failedJobsHistoryLimit` controls how many failed scans are supposed to be kept until the oldest one will be deleted.

The rest of the parameters are set according to your scanType. In this case it's `typo3scan`. Its corresponding scanner configuration can be found [here](/docs/scanners/typo3scan).

Now we can run our scheduled scan via:

```bash
kubectl apply -f scheduled-scan.yaml
```

The scan should be properly created and you should see it running via:

```bash
kubectl get scheduledscans
```

And you get the following (The findings column might be different):

```bash
NAME                                  TYPE        INTERVAL   FINDINGS
old-typo3.demo-targets.svc.org-5min   typo3scan   5m         53
```

_Hint:_ If you want to restart the scan, you must delete it first:

```bash
# Delete all scheduled scans:
kubectl delete scheduledscan --all
# Delete our specific scheduled scan:
kubectl delete scheduledscan old-typo3.demo-targets.svc.org-5min
```

We can check on the individual scans that have been done according to this scheduled/repeating scan via:

```bash
kubectl get scans
```

After 15 minutes, we see the following:

```bash
NAME                                             TYPE        STATE   FINDINGS
old-typo3.demo-targets.svc.org-5min-1633093504   typo3scan   Done    53
old-typo3.demo-targets.svc.org-5min-1633093805   typo3scan   Done    53
old-typo3.demo-targets.svc.org-5min-1633094105   typo3scan   Done    53
```

We can also make sure that the time interval is being respected by the ScheduledScan by looking at the age of the pods in use via:

```bash
kubectl get pods
```

You would see something similar to this. The pod name suffix is not going to be the same.

```bash
NAME                                                              READY   STATUS      RESTARTS   AGE
scan-old-typo3.demo-targets.svc.org-5min-1633093504-7h--1-msn8t   0/2     Completed   0          12m
scan-old-typo3.demo-targets.svc.org-5min-1633093805-cm--1-jwgz2   0/2     Completed   0          7m40s
scan-old-typo3.demo-targets.svc.org-5min-1633094105-zb--1-qkxzw   0/2     Completed   0          2m40s
```

And we're done! The repeating scan now works. Take a look at [cascading scans](/docs/how-tos/scanning-networks) next if you haven't yet. Cascading scans and repeating scans work well together. Have fun!
