<p align="center">
  <a href="https://opensource.org/licenses/Apache-2.0"><img alt="License Apache-2.0" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/releases/latest"><img alt="GitHub release (latest SemVer)" src="https://img.shields.io/github/v/release/secureCodeBox/secureCodeBox?sort=semver"></a>
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Incubator Project" src="https://img.shields.io/badge/OWASP-Incubator%20Project-365EAA"></a>
  <a href="https://artifacthub.io/packages/search?repo=seccurecodebox"><img alt="Artifact HUB" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/seccurecodebox"></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/secureCodeBox/secureCodeBox?logo=GitHub"></a>
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"></a>
</p>

## What is OWASP secureCodeBox?

<p align="center">
  <img alt="secureCodeBox Logo" src="https://docs.securecodebox.io/img/Logo_Color.svg" width="250px">
</p>

_[OWASP secureCodeBox][scb-github]_ is an automated and scalable open source solution that can be used to integrate various *security vulnerability scanners* with a simple and lightweight interface. The _secureCodeBox_ mission is to support *DevSecOps* Teams to make it easy to automate security vulnerability testing in different scenarios.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The secureCodeBox project is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. It is also possible to start the different integrated security vulnerability scanners based on a docker infrastructure.

### Quickstart with secureCodeBox on kubernetes

You can find resources to help you get started on our [documentation website](https://docs.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://docs.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://docs.securecodebox.io/docs/getting-started/first-scans) with it.

## What is Git-Repo-Scanner?

Git-Repo-Scanner is a small Python script which discovers repositories on GitHub or GitLab. The main purpose of this scanner
is to provide a cascading input for the [gitleaks](https://github.com/secureCodeBox/secureCodeBox/tree/main/scanners/gitleaks).
 scanner.

## Deployment
# Install HelmChart (use -n to configure another namespace)
The git-repo-scanner `scanType` can be deployed via helm:

```bash
helm upgrade --install git-repo-scanner secureCodeBox/git-repo-scanner
```

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
- `--url`: The url of the api for a GitHub enterprise server. Skip this option for repos on <https://github.com>.
- `--access-token`: Your personal GitHub access token.
- `--ignore-repos`: A list of GitHub repository ids you want to ignore
- `--obey-rate-limit`: True to obey the rate limit of the GitHub server (default), otherwise False
- `--activity-since-duration`: Return git repo findings with repo activity (e.g. commits) more recent than a specific date expressed by a duration (now + duration). A duration string is a possibly signed sequence of decimal numbers, each
                               with optional fraction and a unit suffix, such as '1h' or '2h45m'. Valid time units are 'm', 'h', 'd', 'w'.
- `--activity-until-duration`: Return git repo findings with repo activity (e.g. commits) older than a specific date expressed by a duration (now + duration). A duration string is a possibly signed sequence of decimal numbers, each with
                               optional fraction and a unit suffix, such as '1h' or '2h45m'. Valid time units are 'm', 'h', 'd', 'w'.

For now only organizations are supported, so the option is mandatory. We **strongly recommend** providing an access token
for authentication. If not provided the rate limiting will kick in after about 30 repositories scanned.

#### GitLab
For type GitLab you can use the following options:
- `--url`: The url of the GitLab server.
- `--access-token`: Your personal GitLab access token.
- `--group`: A specific GitLab group id you want to san, including subgroups.
- `--ignore-groups`: A list of GitLab group ids you want to ignore
- `--ignore-repos`: A list of GitLab project ids you want to ignore
- `--obey-rate-limit`: True to obey the rate limit of the GitLab server (default), otherwise False
- `--activity-since-duration`: Return git repo findings with repo activity (e.g. commits) more recent than a specific date expressed by a duration (now + duration). A duration string is a possibly signed sequence of decimal numbers, each
                               with optional fraction and a unit suffix, such as '1h' or '2h45m'. Valid time units are 'm', 'h', 'd', 'w'.
- `--activity-until-duration`: Return git repo findings with repo activity (e.g. commits) older than a specific date expressed by a duration (now + duration). A duration string is a possibly signed sequence of decimal numbers, each with
                               optional fraction and a unit suffix, such as '1h' or '2h45m'. Valid time units are 'm', 'h', 'd', 'w'.

For Gitlab, the url and the access token is mandatory. If you don't provide a specific group id, all projects
on the Gitlab server are going to be discovered.

## Contributing

Contributions are welcome and extremely helpful 🙌
Please have a look at [Contributing](./CONTRIBUTING.md)

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [Slack][scb-slack]
- [Twitter][scb-twitter]

secureCodeBox is an official [OWASP][scb-owasp] project.

## Requirements

Kubernetes: `>=v1.11.0-0`

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| image.repository | string | `"docker.io/securecodebox/scanner-git-repo-scanner"` | Container Image to run the scan |
| image.tag | string | `nil` | defaults to the charts version |
| parseJob.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| parserImage.repository | string | `"docker.io/securecodebox/parser-git-repo-scanner"` | Parser image repository |
| parserImage.tag | string | defaults to the charts version | Parser image tag |
| scannerJob.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scannerJob.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scannerJob.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scannerJob.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scannerJob.securityContext | object | `{}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scannerJob.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |

## License

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://docs.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
