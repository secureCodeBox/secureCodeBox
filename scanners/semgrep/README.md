---
title: "Semgrep"
category: "scanner"
type: "Repository"
state: "released"
appVersion: "1.1.0"
usecase: "Static Code Analysis"
---

![Semgrep logo](https://raw.githubusercontent.com/returntocorp/semgrep-docs/main/static/img/semgrep-icon-text-horizontal.svg)

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
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"/></a>
</p>

## What is Semgrep?
Semgrep ("semantic grep") is a static source code analyzer that can be used to search for specific patterns in code.
It allows you to either [write your own rules](https://semgrep.dev/learn), or use one of the [many pre-defined rulesets](https://semgrep.dev/r) curated by the semgrep team.

To learn more about semgrep, visit [semgrep.dev](https://semgrep.dev).

## Deployment
The semgrep chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install semgrep secureCodeBox/semgrep
```

## Scanner Configuration

Semgrep requires one or more ruleset(s) to run its scans.
Refer to the [semgrep rule database](https://semgrep.dev/r) for more details.
A good starting point would be [p/ci](https://semgrep.dev/p/ci) (for security checks with a low false-positive rate) or [p/security-audit](https://semgrep.dev/p/security-audit) (for a more comprehensive security audit, which may include more false-positive results).

Semgrep needs access to the source code to run its analysis.
To use it with secureCodeBox, you thus need a way to provision the data into the scan container.
The recommended method is to use `initContainers` to clone a VCS repository.
The simplest example, using a public Git repository from GitHub, looks like this:

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "semgrep-vulnerable-flask-app"
spec:
  # Specify a Kubernetes volume that will be shared between the scanner and the initContainer
  volumes:
    - name: repository
      emptyDir: {}
  # Mount the volume in the scan container
  volumeMounts:
    - mountPath: "/repo/"
      name: repository
  # Specify an init container to clone the repository
  initContainers:
    - name: "provision-git"
      # Use an image that includes git
      image: bitnami/git
      # Mount the same volume we also use in the main container
      volumeMounts:
        - mountPath: "/repo/"
          name: repository
      # Specify the clone command and clone into the volume, mounted at /repo/
      command:
        - git
        - clone
        - "https://github.com/we45/Vulnerable-Flask-App"
        - /repo/flask-app
  # Parameterize the semgrep scan itself
  scanType: "semgrep"
  parameters:
    - "-c"
    - "p/ci"
    - "/repo/flask-app"
```

If your repository requires authentication to clone, you will have to give the initContainer access to some method of authentication.
This could be a personal access token ([GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token), [GitLab](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)), project access token ([GitLab](https://docs.gitlab.com/ee/user/project/settings/project_access_tokens.html)), deploy key ([GitHub](https://docs.github.com/en/developers/overview/managing-deploy-keys#deploy-keys) / [GitLab](https://docs.gitlab.com/ee/user/project/deploy_keys/)), deploy token ([GitLab](https://docs.gitlab.com/ee/user/project/deploy_tokens/)), or a server-to-server token ([GitHub](https://docs.github.com/en/developers/overview/managing-deploy-keys#server-to-server-tokens)).
Due to the large variety of options, we do not provide documentation for all of them here.
Refer to the linked documentation for details on the different methods, and remember to use [Kubernetes secrets](https://kubernetes.io/docs/concepts/configuration/secret/) to manage keys and tokens.

## Cascading Rules
By default, the semgrep scanner does not install any [cascading rules](docs/hooks/cascading-scans), as some aspects of the semgrep scan (like the used ruleset) should be customized.
However, you can easily create your own cascading rule, for example to run semgrep on the output of [git-repo-scanner](docs/scanners/git-repo-scanner).
As a starting point, consider the following cascading rule to scan all public GitHub repositories found by git-repo-scanner using the p/ci ruleset of semgrep:

```yaml
apiVersion: "cascading.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "semgrep-public-github-repos"
  labels:
    securecodebox.io/invasive: non-invasive
    securecodebox.io/intensive: medium
spec:
  matches:
    anyOf:
      # We want to scan public GitHub repositories. Change "public" to "private" to scan private repos instead
      - name: "GitHub Repo"
        attributes:
          visibility: public
  scanSpec:
    # Configure the scanSpec for semgrep
    scanType: "semgrep"
    parameters:
      - "-c"
      - "p/ci"  # Change this to use a different rule set
      - "/repo/"
    volumes:
      - name: repo
        emptyDir: {}
    volumeMounts:
      - name: repo
        mountPath: "/repo/"
    initContainers:
      - name: "git-clone"
        image: bitnami/git
        # The command assumes that GITHUB_TOKEN contains a GitHub access token with access to the repository.
        # GITHUB_TOKEN is set below in the "env" section.
        # If you do not wan to use an access token, remove it from the URL below.
        command:
          - git
          - clone
          - "https://$(GITHUB_TOKEN)@github.com/{{{attributes.full_name}}}"
          - /repo/
        volumeMounts:
          - mountPath: "/repo/"
            name: repo
        # Load the GITHUB_TOKEN from the kubernetes secret with the name "github-access-token"
        # Create this secret using, for example:
        #     echo -n 'YOUR TOKEN GOES HERE' > github-token.txt && kubectl create secret generic github-access-token --from-file=token=github-token.txt
        # IMPORTANT: Ensure that github-token.txt does not have a new line at the end of the file. This is automatically done by using "echo -n" to create it.
        # However, if you create it with an editor, some editors (most notably, vim) will create hidden newlines at the end of files, which will cause issues.
        env:
          - name: GITHUB_TOKEN
            valueFrom:
              secretKeyRef:
                name: github-access-token
                key: token
```

Use this configuration as a baseline for your own rules.

## Requirements

Kubernetes: `>=v1.11.0-0`

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascadingRules.enabled | bool | `false` | Enables or disables the installation of the default cascading rules for this scanner |
| imagePullSecrets | list | `[]` | Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/) |
| parser.affinity | object | `{}` | Optional affinity settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| parser.backoffLimit | int | `3` |  |
| parser.env | list | `[]` |  |
| parser.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| parser.image.repository | string | `"securecodebox/parser-semgrep"` | Parser image repository |
| parser.image.tag | string | defaults to the charts version | Parser image tag |
| parser.resources | object | { requests: { cpu: "200m", memory: "100Mi" }, limits: { cpu: "400m", memory: "200Mi" } } | Optional resources lets you control resource limits and requests for the parser container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ |
| parser.scopeLimiterAliases | object | `{}` | Optional finding aliases to be used in the scopeLimiter. |
| parser.tolerations | list | `[]` | Optional tolerations settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| scanner.activeDeadlineSeconds | string | `nil` | There are situations where you want to fail a scan Job after some amount of time. To do so, set activeDeadlineSeconds to define an active deadline (in seconds) when considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-termination-and-cleanup) |
| scanner.affinity | object | `{}` | Optional affinity settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| scanner.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scanner.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scanner.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scanner.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| scanner.image.repository | string | `"docker.io/returntocorp/semgrep"` | Container Image to run the scan |
| scanner.image.tag | string | `nil` | defaults to the charts appVersion |
| scanner.podSecurityContext | object | `{}` | Optional securityContext set on scanner pod (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":false,"runAsNonRoot":false}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.tolerations | list | `[]` | Optional tolerations settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| scanner.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://www.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE

