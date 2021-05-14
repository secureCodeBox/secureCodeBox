---
title: "git-repo-scanner"
category: "scanner"
type: "Repository"
state: "in progress"
appVersion: "0.1"
usecase: "Discover git repositories"
---

Git-Repo-Scanner is a small Python script which discovers repositories on GitHub or GitLab. The main purpose of this scanner
is to provide a cascading input for the [gitleaks](https://github.com/secureCodeBox/secureCodeBox/tree/main/scanners/gitleaks).
 scanner.

## Deployment

The  git-repo-scanner can be deployed with helm:

```bash
helm upgrade --install gitleaks secureCodeBox/git-repo-scanner
```

## Scanner configuration

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

## Chart Configuration

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

