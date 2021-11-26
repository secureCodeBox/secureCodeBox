---
title: "CMSeeK"
category: "scanner"
type: "CMS"
state: "released"
appVersion: "v.1.1.3"
usecase: "Automation of the process of detecting the Joomla CMS and its core vulnerabilities"
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

## What is CMSeeK?
CMSeeK is an open source penetration testing tool to automate the process of detecting various types of CMS and its installed extensions.
Only the Joomla CMS is supported by secureCodeBox. CMSeeK has a database with known vulnerabilities.

To learn more about the CMSeeK scanner itself, visit the CMSeeK GitHub repository [here](https://github.com/Tuhinshubhra/CMSeeK).

## Deployment
The cmseek chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install cmseek secureCodeBox/cmseek
```

## Scanner Configuration

The CMSeeK targets are specified with the `-u` parameter. The target should be a URL.

Additional CMSeeK scan features can be configured via the parameter attribute.

Some useful example parameters listed below:

- `-u URL, --url URL` : Target Url.
- `--follow-redirect` : Follows all/any redirect(s).
- `--no-redirect` : skips all redirects and tests the input target(s)
- `-r, --random-agent`: Use a random user agent.
- `--googlebot`: Use Google bot user agent.
- `--user-agent USER_AGENT`:  Specify a custom user agent

## Requirements

Kubernetes: `>=v1.11.0-0`

