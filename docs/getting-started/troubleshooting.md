---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Troubleshooting"
sidebar_label: Troubleshooting
path: "docs/getting-started/troubleshooting"
---

If you experience any problems using the _secureCodeBox_, you may find an answer here.
Should your problem not be covered here, however, you can also join our 
[Slack Channel](https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU%22)
to get more specific help.
If you think that you encountered a general problem that should be fixed, we are very grateful if you take the time
to create an issue in our [GitHub Repository](https://github.com/secureCodeBox/secureCodeBox/issues). 

## Installation issues

### *helm upgrade --install* does not work

* Check if you have added the secureCodeBox repository:
```bash
helm repo add secureCodeBox https://charts.securecodebox.io
```
* Check your spelling: Helm repo is case-sensitive and no backslash at the end of a resource
```bash
# WRONG!
helm upgrade --install nmap securecodebox/nmap
# ALSO WRONG!
helm upgrade --install nmap secureCodeBox/nmap/
# CORRECT
helm upgrade --install nmap secureCodeBox/nmap
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
