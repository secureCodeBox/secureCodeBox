<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->

---
title: "User Guide"
path: "docs/user-guide"
category: "use"
---

<!-- end -->

# Using the secureCodeBox


> ✍ **Page under construction.**

## Cascading Scans

### Install Hook

Installing the Cascading Scan hook will add a ReadOnly Hook to your namespace which looks for matching CascadingRules in the namespace and starts subsequent scans accordingly.

```bash
helm install cascading-scans ./hooks/cascading-scans
```

### Verify Hook Installation

Successful installation can be verified by retrieving installed ScanCompletionHooks.

```bash
kubectl get ScanCompletionHooks
```

The result should contain a hook for cascading scans.

```bash
NAME              TYPE       IMAGE
cascading-scans   ReadOnly   docker.io/securecodebox/cascading-scans:latest
```

### Verify CascadingRules

CascadingRules are included in each individual scanner's Helm chart.

```bash
kubectl get CascadingRules
```

Output should show these CascadingRules:

```bash
NAME             STARTS              INVASIVENESS   INTENSIVENESS
https-tls-scan   sslyze              non-invasive   light
imaps-tls-scan   sslyze              non-invasive   light
nikto-http       nikto               non-invasive   medium
nmap-smb         nmap                non-invasive   light
pop3s-tls-scan   sslyze              non-invasive   light
smtps-tls-scan   sslyze              non-invasive   light
ssh-scan         ssh-scan            non-invasive   light
zap-http         zap-baseline-scan   non-invasive   medium
```

### Start Scans

When you start a normal Scan, no CascadingRule will be applied.
To use CascadingRules the scan must be marked to allow cascading rules.

This is implemented using kubernetes label selectors, meaning that scans mark the classes of scans which are allowed to be cascaded by the current one.

### Example

```bash
cat <<EOF | kubectl apply -f -
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "example.com"
spec:
  scanType: nmap
  parameters:
    - -p22,80,443
    - example.com
  cascades:
    matchLabels:
      securecodebox.io/intensive: light
EOF
```

This Scan will used all CascadingRules which are labeled with a "light" intensity.

You can lookup which CascadingRules this selects by running:

```bash
kubectl get CascadingRules -l "securecodebox.io/intensive=light"
NAME             STARTS     INVASIVENESS   INTENSIVENESS
https-tls-scan   sslyze     non-invasive   light
imaps-tls-scan   sslyze     non-invasive   light
nmap-smb         nmap       non-invasive   light
pop3s-tls-scan   sslyze     non-invasive   light
smtps-tls-scan   sslyze     non-invasive   light
ssh-scan         ssh-scan   non-invasive   light
```

The label selectors also allow the more powerful [matchExpression](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#set-based-requirement) selectors:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "example.com"
spec:
  scanType: nmap
  parameters:
    - -p22,80,443
    - example.com
  cascades:
    # Using matchExpression instead of matchLabels
    matchExpression:
      key: "securecodebox.io/intensive"
      operator: In
      # This select both light and medium intensity rules
      values: [light, medium]
EOF
```

This selection can be replicated in kubectl using:

```bash
kubectl get CascadingRules -l "securecodebox.io/intensive in (light,medium)"
NAME             STARTS              INVASIVENESS   INTENSIVENESS
https-tls-scan   sslyze              non-invasive   light
imaps-tls-scan   sslyze              non-invasive   light
nikto-http       nikto               non-invasive   medium
nmap-smb         nmap                non-invasive   light
pop3s-tls-scan   sslyze              non-invasive   light
smtps-tls-scan   sslyze              non-invasive   light
ssh-scan         ssh-scan            non-invasive   light
zap-http         zap-baseline-scan   non-invasive   medium
```
