---
title: "git-repo-scanner"
category: "scanner"
type: "Repository"
state: "in progress"
appVersion: "0.1"
usecase: "Discover git repositories"
---

Git-Repo-Scanner is a small Python script which discovers repositories on GitHub or GitLab. The main purpose of this scanner
is to provide a cascading input for the gitleaks scanner.

## Deployment

The  git-repo-scanner can be deployed with helm:

```bash
helm upgrade --install gitleaks secureCodeBox/git-repo-scanner
```

## Scanner configuration

The scanner options can be divided into two groups for gitlab and github. You can choose the git
repository type with the option:

```bash
--git-type github
or
--git-type gitlab
```

#### GitHub
For type github you can use the following options:
- `--organization`: The name of the github organization you want to scan.
- `--url`: The url of the api for a github enterprise server. Skip this option for repos on <https://github.com>.
- `--access-token`: Your personal github access token.
- `--ignore-repos`: A list of github repository ids you want to ignore

For now only organizations are supported so the option is mandatory. We **strongly recommend** providing an access token
for authentication. If not provided the rate limiting will kick in after about 30 repositories scanned.

#### GitLab
For type gitlab you can use the following options:
- `--url`: The url of the gitlab server.
- `--access-token`: Your personal gitlab access token.
- `--group`: A specific gitlab group id you want to san, including subgroups.
- `--ignore-groups`: A list of gitlab group ids you want to ignore
- `--ignore-repos`: A list of gitlab project ids you want to ignore

For gitlab the url and the access token is mandatory. If you don't provide a specific group id all projects
on the gitlab server are going to be discovered.

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| image.repository | string | `"docker.io/securecodebox/scanner-git-repo-scanner"` | Container Image to run the scan |
| image.tag | string | `nil` | defaults to the charts version |
| parserImage.repository | string | `"docker.io/securecodebox/parser-git-repo-scanner"` | Parser image repository |
| parserImage.tag | string | defaults to the charts version | Parser image tag |
| scannerJob.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scannerJob.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scannerJob.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scannerJob.securityContext | object | `{}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scannerJob.ttlSecondsAfterFinished | string | `nil` | Defines how long the scanner job after finishing will be available (see: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/) |

