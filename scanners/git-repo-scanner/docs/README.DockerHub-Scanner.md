<!--
SPDX-FileCopyrightText: the secureCodeBox authors

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
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Lab Project" src="https://img.shields.io/badge/OWASP-Lab%20Project-yellow"/></a>
  <a href="https://artifacthub.io/packages/search?repo=securecodebox"><img alt="Artifact HUB" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/securecodebox"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/secureCodeBox/secureCodeBox?logo=GitHub"/></a>
  <a href="https://infosec.exchange/@secureCodeBox"><img alt="Mastodon Follower" src="https://img.shields.io/mastodon/follow/111902499714281911?domain=https%3A%2F%2Finfosec.exchange%2F"/></a>
</p>

## What is OWASP secureCodeBox?

<p align="center">
  <img alt="secureCodeBox Logo" src="https://www.securecodebox.io/img/Logo_Color.svg" width="250px"/>
</p>

_[OWASP secureCodeBox][scb-github]_ is an automated and scalable open source solution that can be used to integrate various *security vulnerability scanners* with a simple and lightweight interface. The _secureCodeBox_ mission is to support *DevSecOps* Teams to make it easy to automate security vulnerability testing in different scenarios.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The secureCodeBox project is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. It is also possible to start the different integrated security vulnerability scanners based on a docker infrastructure.

### Quickstart with secureCodeBox on Kubernetes

You can find resources to help you get started on our [documentation website](https://www.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://www.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://www.securecodebox.io/docs/getting-started/first-scans) with it.

## Supported Tags
- `latest`  (represents the latest stable release build)
- tagged releases, e.g. `3.0.0`, `2.9.0`, `2.8.0`, `2.7.0`

## How to use this image
This `scanner` image is intended to work in combination with the corresponding `parser` image to parse the scanner `findings` to generic secureCodeBox results. For more information details please take a look at the [project page][scb-docs] or [documentation page][https://www.securecodebox.io/docs/scanners/git-repo-scanner].

```bash
docker pull securecodebox/scanner-git-repo-scanner
```

## What is Git-Repo-Scanner?

Git-Repo-Scanner is a small Python script which discovers repositories on GitHub or GitLab. The main purpose of this scanner
is to provide a cascading input for the [gitleaks](https://www.securecodebox.io/docs/scanners/gitleaks) and [semgrep](https://www.securecodebox.io/docs/scanners/semgrep) scanners.

## Scanner Configuration

The scanner options can be divided into two groups for Gitlab and GitHub. You can choose the git
repository type with the option:

```bash
--git-type github
or
--git-type Gitlab
```

#### GitHub
For type GitHub you can use the following options:
- `--organization`: The name of the GitHub organization you want to scan.
- `--url`: The url of the api for a GitHub enterprise server. Skip this option for repos on [https://github.com](https://github.com).
- `--access-token`: Your personal GitHub access token (needs full `repo` rights if you want to also find private repositories, otherwise `repo:status` and `public_repo` is sufficient).
- `--ignore-repos`: A list of GitHub repository ids you want to ignore
- `--obey-rate-limit`: True to obey the rate limit of the GitHub server (default), otherwise False
- `--activity-since-duration`: Return git repo findings with repo activity (e.g. commits) more recent than a specific date expressed by a duration (now + duration). A duration string is a possibly signed sequence of decimal numbers, each
                               with optional fraction and a unit suffix, such as '1h' or '2h45m'. Valid time units are 'm', 'h', 'd', 'w'.
- `--activity-until-duration`: Return git repo findings with repo activity (e.g. commits) older than a specific date expressed by a duration (now + duration). A duration string is a possibly signed sequence of decimal numbers, each with
                               optional fraction and a unit suffix, such as '1h' or '2h45m'. Valid time units are 'm', 'h', 'd', 'w'.
- `--annotate-latest-commit-id`: Set to True to annotate the results with the SHA1 of the latest commit on the main branch. Causes an extra API hit per repository. False by default.

For now only organizations are supported, so the option is mandatory. We **strongly recommend** providing an access token
for authentication, otherwise the API rate limiting will kick in after about 30 repositories scanned.

#### GitLab
For type GitLab you can use the following options:
- `--url`: The url of the GitLab server.
- `--access-token`: Your personal GitLab access token (needs at least `read_api` and `read_repository` scopes).
- `--group`: A specific GitLab group id you want to san, including subgroups.
- `--ignore-groups`: A list of GitLab group ids you want to ignore
- `--ignore-repos`: A list of GitLab project ids you want to ignore
- `--obey-rate-limit`: True to obey the rate limit of the GitLab server (default), otherwise False
- `--activity-since-duration`: Return git repo findings with repo activity (e.g. commits) more recent than a specific date expressed by a duration (now + duration). A duration string is a possibly signed sequence of decimal numbers, each
                               with optional fraction and a unit suffix, such as '1h' or '2h45m'. Valid time units are 'm', 'h', 'd', 'w'.
- `--activity-until-duration`: Return git repo findings with repo activity (e.g. commits) older than a specific date expressed by a duration (now + duration). A duration string is a possibly signed sequence of decimal numbers, each with
                               optional fraction and a unit suffix, such as '1h' or '2h45m'. Valid time units are 'm', 'h', 'd', 'w'.
- `--annotate-latest-commit-id`: Set to True to annotate the results with the SHA1 of the latest commit on the main branch. Causes an extra API hit per repository. False by default.

For Gitlab, the url and the access token is mandatory. If you don't provide a specific group id, all projects
on the Gitlab server are going to be discovered.

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [OWASP Slack (Channel #project-securecodebox)][scb-slack]
- [Mastodon][scb-mastodon]

secureCodeBox is an official [OWASP][scb-owasp] project.

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).

As for any pre-built image usage, it is the image user's responsibility to ensure that any use of this image complies with any relevant licenses for all software contained within.

[scb-owasp]:    https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]:     https://www.securecodebox.io/
[scb-site]:     https://www.securecodebox.io/
[scb-github]:   https://github.com/secureCodeBox/
[scb-mastodon]: https://infosec.exchange/@secureCodeBox
[scb-slack]:    https://owasp.org/slack/invite
[scb-license]:  https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE

