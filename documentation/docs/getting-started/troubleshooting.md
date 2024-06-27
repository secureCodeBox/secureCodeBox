---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Troubleshooting"
sidebar_label: Troubleshooting
path: "docs/getting-started/troubleshooting"
---

If you experience any problems using the _secureCodeBox_, you may find an answer here.
Should your problem not be covered here, however, you can also join the [OWASP Slack](https://owasp.org/slack/invite) (Channel `#project-securecodebox`) to get more specific help.
If you think that you encountered a general problem that should be fixed, we are very grateful if you take the time
to create an issue in our [GitHub Repository](https://github.com/secureCodeBox/secureCodeBox/issues). 

## Installation issues

### *helm upgrade --install* does not work

In most cases this is related to the helm repository missing. secureCodeBox used a classic helm in the default install instructions until 4.6.0.
Since 4.6.0 it's recommended to install our helm charts using the helm charts from the Open Container Initiative (OCI) images.

E.g.

```bash
# OUTDATE
helm upgrade --install nmap secureCodeBox/nmap
# WRONG!
helm upgrade --install nmap securecodebox/nmap
# ALSO WRONG!
helm upgrade --install nmap secureCodeBox/nmap/
# CORRECT
helm upgrade --install nmap oci://ghcr.io/securecodebox/helm/nmap
```

## Running scans

### Error: ImagePullBackOff

* Try to update your helm repository before installing the scanner (it is a good idea to do this periodically):
```bash
helm repo update secureCodeBox
```

* Check that you actually use a scanner from the repo instead of a local one:
```bash
# Local:
helm upgrade --install nmap ./scanners/nmap/
# Repo:
helm upgrade --install nmap secureCodeBox/nmap
```

* If you want to use a local docker image for your scanner, check that your *values.yaml* file is correct and follow 
these [instructions](https://www.securecodebox.io/docs/contributing/integrating-a-scanner/values.yaml#using-local-images).


* If you use an image from the repository, make sure that it has already been included in the latest 
[release](https://github.com/secureCodeBox/secureCodeBox/releases).
