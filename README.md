<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->

# OWASP secureCodeBox

<p align="center">
  <img alt="secureCodeBox Logo" src="./docs/resources/securecodebox-logo.svg" width="500px">
  <img alt="secureCodeBox Logo" src="https://owasp.org/assets/images/logo.png" width="200px">
</p>

<p align="center">
  <a href="https://opensource.org/licenses/Apache-2.0"><img alt="License Apache-2.0" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/releases/latest"><img alt="GitHub release (latest SemVer)" src="https://img.shields.io/github/v/release/secureCodeBox/secureCodeBox?sort=semver"></a>
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Lab Project" src="https://img.shields.io/badge/OWASP-Lab%20Project-yellow"></a>
  <a href="https://artifacthub.io/packages/search?repo=securecodebox"><img alt="Artifact HUB" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/secureCodeBox"></a>
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/actions?query=workflow%3ACI"><img alt="Build" src="https://github.com/secureCodeBox/secureCodeBox/workflows/CI/badge.svg"></a>
  <a href="https://snyk.io/test/github/secureCodeBox/secureCodeBox/"><img alt="Known Vulnerabilities" src="https://snyk.io/test/github/secureCodeBox/secureCodeBox/badge.svg"></a>
  <a href="https://app.fossa.com/projects/git%2Bgithub.com%2FsecureCodeBox%2FsecureCodeBox?ref=badge_shield" alt="FOSSA Status"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2FsecureCodeBox%2FsecureCodeBox.svg?type=shield"/></a>
</p>

> _secureCodeBox_ is a kubernetes based, modularized toolchain for continuous security scans of your software project. Its goal is to orchestrate and easily automate a bunch of security-testing tools out of the box.

<p align="center">
  <img width="950" src="./docs/resources/ascii/scb-first-start.svg">
</p>

## Overview

<!-- toc -->

- [OWASP secureCodeBox](#owasp-securecodebox)
  - [Overview](#overview)
  - [Purpose of this Project](#purpose-of-this-project)
  - [Quickstart](#quickstart)
  - [Architecture Overview](#architecture-overview)
  - [Upgrading](#upgrading)
  - [License](#license)
  - [Community](#community)
  - [Contributing](#contributing)
  - [Sponsors](#sponsors)
  - [Author Information](#author-information)

For additional documentation aspects please have a look at our [documentation website](https://www.securecodebox.io):

<!-- tocstop -->

## Purpose of this Project

The typical way to ensure application security is to hire a security specialist (aka penetration tester) at some point in your project to check the application for security bugs and vulnerabilities. Usually, this check is done at a later stage of the project and has two major drawbacks:

1. Nowadays, a lot of projects do continuous delivery, which means the developers deploy new versions multiple times each day. The penetration tester is only able to check a single snapshot, but some further commits could introduce new security issues. To ensure ongoing application security, the penetration tester should also continuously test the application. Unfortunately, such an approach is rarely financially feasible.
2. Due to a typically time boxed analysis, the penetration tester has to focus on trivial security issues (low-hanging fruit) and therefore will probably not address the serious, non-obvious ones.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

![secureCodeBox Architecture](./docs/resources/macbook_kibana.jpg)

The purpose of _secureCodeBox_ **is not** to replace the penetration testers or make them obsolete. We strongly recommend to run extensive tests by experienced penetration testers on all your applications.

**Important note**: The _secureCodeBox_ is no simple one-button-click-solution! You must have a deep understanding of security and how to configure the scanners. Furthermore, an understanding of the scan results and how to interpret them is also necessary.

There is a German article about [Security DevOps – Angreifern (immer) einen Schritt voraus][secdevops-objspec] in the software engineering journal [OBJEKTSpektrum][objspec].

## Quickstart

You can find resources to help you get started on our [documentation website](https://www.securecodebox.io) including instruction on how to [install the secureCodeBox](https://www.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://www.securecodebox.io/docs/getting-started/first-scans) with it.

## Architecture Overview

![secureCodeBox Architecture](./docs/resources/scb-architecture.svg)

## Upgrading

For the steps required for upgrading your secureCodeBox installation, see [Upgrading](./UPGRADING.md).

## License

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [Slack][scb-slack]
- [Twitter][scb-twitter]

secureCodeBox is an official [OWASP][owasp] project.

## Contributing

Contributions are welcome and extremely helpful 🙌
Please have a look at [Contributing](./CONTRIBUTING.md)

## Sponsors

<p align="left">
  <a href="https://www.iteratec.com/en/"><img alt="iteratec Logo" src="./docs/resources/sponsors/Logo_iteratec.svg" width="300px"></a>
</p>
<p align="left">
  <a href="https://sda-se.com/?lang=en"><img alt="SDA SE Logo" src="./docs/resources/sponsors/Logo_sda-se.png" width="200px" style="margin: 5px; vertical-align: middle;"></a>
  <a href="https://pagel.pro/en/"><img alt="Timo Pagel IT Consulting Logo" src="./docs/resources/sponsors/Logo_timo-pagel-it-consulting.png" width="200px" style="margin: 5px; vertical-align: middle;"></a>
  <a href="https://www.secura.com/en/"><img alt="Secura Logo" src="./docs/resources/sponsors/Logo_secura.svg" width="200px" style="margin: 5px; vertical-align: middle;"></a>
  <a href="https://www.signal-iduna.de/"><img alt="Signal Iduna Logo" src="./docs/resources/sponsors/Logo_signal-iduna.svg" width="200px" style="margin: 5px; vertical-align: middle;"></a>
</p>

## Author Information

Sponsored and maintained by [iteratec GmbH](https://www.iteratec.com/) - [secureCodeBox.io](https://www.securecodebox.io/)

[owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[objspec]: https://www.sigs-datacom.de/fachzeitschriften/objektspektrum.html
[secdevops-objspec]: http://www.sigs.de/public/ots/2017/OTS_DevOps_2017/Seedorff_Pfaender_OTS_%20DevOps_2017.pdf
[scb-github]: https://github.com/secureCodeBox/
[scb-engine]: https://github.com/secureCodeBox/engine
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
