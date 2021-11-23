---
title: "Typo3Scan"
category: "scanner"
type: "CMS"
state: "released"
appVersion: "0.7.2"
usecase: "Automation of the process of detecting the Typo3 CMS and its installed extensions"
---

<!--
SPDX-FileCopyrightText: 2021 iteratec GmbH

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
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Incubator Project" src="https://img.shields.io/badge/OWASP-Incubator%20Project-365EAA"/></a>
  <a href="https://artifacthub.io/packages/search?repo=securecodebox"><img alt="Artifact HUB" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/securecodebox"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/secureCodeBox/secureCodeBox?logo=GitHub"/></a>
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"/></a>
</p>

## What is Typo3Scan?
Typo3Scan is an open source penetration testing tool, that automates the process of detecting the Typo3 CMS version and its installed extensions. It also has a database with known vulnerabilities for core and extensions.
The vulnerabilities corresponding to the version detected are presented as findings.
To learn more about the Typo3Scan scanner itself, visit the Typo3Scan GitHub repository [here](https://github.com/whoot/Typo3Scan).

## Deployment
The typo3scan chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install typo3scan secureCodeBox/typo3scan
```

## Scanner Configuration

The Typo3Scan target is specified with the `-d` parameter. The target should be a url, hostname or an IP address.
:::caution
Please note that, the target url has to start with http:// or https:// when using a hostname or IP address as a target for the scan to work correctly.
For example: `http://localhost` or `https://123.45.67.890:80`
:::

Additional Typo3Scan scan features can be configured via the parameter attribute.

Some useful example parameters listed below:

- `--vuln` : Check for extensions with known vulnerabilities only.
- `--timeout TIMEOUT` : Request Timeout. Default: 10 seconds
- `--auth USER:PASS`: Username and Password for HTTP Basic Authorization.
- `--cookie NAME=VALUE`: Can be used for authenticiation based on cookies.
- `--agent USER-AGENT`: Set custom User-Agent for requests.
- `--threads THREADS`: The number of threads to use for enumerating extensions. Default: 5
- `--json`: Output results to json file
- `--force`: Force enumeration
- `--no-interaction`: Do not ask any interactive question

## Requirements

Kubernetes: `>=v1.11.0-0`

