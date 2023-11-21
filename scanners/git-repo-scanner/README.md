---
title: "Git Repo Scanner"
category: "scanner"
type: "Repository"
state: "released"
appVersion: "1.1"
usecase: "Discover Git repositories"
---

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

## What is Git-Repo-Scanner?

Git-Repo-Scanner is a small Python script which discovers repositories on GitHub or GitLab. The main purpose of this scanner
is to provide a cascading input for the [gitleaks](/docs/scanners/gitleaks) and [semgrep](/docs/scanners/semgrep) scanners.

## Deployment
The git-repo-scanner chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
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

## Requirements

Kubernetes: `>=v1.11.0-0`

<table>
    <thead>
        <th>Key</th>
        <th>Type</th>
        <th class="default-column">Default</th>
        <th>Description</th>
    </thead>
    <tbody>
        <tr>
            <td>cascadingRules.enabled</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Enables or disables the installation of the default cascading rules for this scanner</td>
        </tr>
        <tr>
            <td>imagePullSecrets</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/)</td>
        </tr>
        <tr>
            <td>parser.affinity</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Optional affinity settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/)</td>
        </tr>
        <tr>
            <td>parser.env</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional environment variables mapped into each parseJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)</td>
        </tr>
        <tr>
            <td>parser.image.pullPolicy</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"IfNotPresent"`
</pre></td>
            <td>Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images</td>
        </tr>
        <tr>
            <td>parser.image.repository</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"docker.io/securecodebox/parser-git-repo-scanner"`
</pre></td>
            <td>Parser image repository</td>
        </tr>
        <tr>
            <td>parser.image.tag</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    defaults to the charts version
</pre></td>
            <td>Parser image tag</td>
        </tr>
        <tr>
            <td>parser.resources</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

   
</pre></td>
            <td>Optional resources lets you control resource limits and requests for the parser container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/</td>
        </tr>
        <tr>
            <td>parser.scopeLimiterAliases</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Optional finding aliases to be used in the scopeLimiter.</td>
        </tr>
        <tr>
            <td>parser.tolerations</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional tolerations settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)</td>
        </tr>
        <tr>
            <td>parser.ttlSecondsAfterFinished</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>seconds after which the Kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/</td>
        </tr>
        <tr>
            <td>scanner.activeDeadlineSeconds</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>There are situations where you want to fail a scan Job after some amount of time. To do so, set activeDeadlineSeconds to define an active deadline (in seconds) when considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-termination-and-cleanup)</td>
        </tr>
        <tr>
            <td>scanner.affinity</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Optional affinity settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/)</td>
        </tr>
        <tr>
            <td>scanner.backoffLimit</td>
            <td>int</td>
            <td class="default-column">
<pre lang="yaml">

   
</pre></td>
            <td>There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy)</td>
        </tr>
        <tr>
            <td>scanner.env</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)</td>
        </tr>
        <tr>
            <td>scanner.extraContainers</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)</td>
        </tr>
        <tr>
            <td>scanner.extraVolumeMounts</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/)</td>
        </tr>
        <tr>
            <td>scanner.extraVolumes</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/)</td>
        </tr>
        <tr>
            <td>scanner.image.pullPolicy</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"IfNotPresent"`
</pre></td>
            <td>Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images</td>
        </tr>
        <tr>
            <td>scanner.image.repository</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"docker.io/securecodebox/scanner-git-repo-scanner"`
</pre></td>
            <td>Container Image to run the scan</td>
        </tr>
        <tr>
            <td>scanner.image.tag</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>defaults to the charts version</td>
        </tr>
        <tr>
            <td>scanner.nameAppend</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>append a string to the default scantype name.</td>
        </tr>
        <tr>
            <td>scanner.podSecurityContext</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Optional securityContext set on scanner pod (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)</td>
        </tr>
        <tr>
            <td>scanner.resources</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/)</td>
        </tr>
        <tr>
            <td>scanner.securityContext</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":true,"runAsNonRoot":true}`
</pre></td>
            <td>Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)</td>
        </tr>
        <tr>
            <td>scanner.securityContext.allowPrivilegeEscalation</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Ensure that users privileges cannot be escalated</td>
        </tr>
        <tr>
            <td>scanner.securityContext.capabilities.drop[0]</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"all"`
</pre></td>
            <td>This drops all linux privileges from the container.</td>
        </tr>
        <tr>
            <td>scanner.securityContext.privileged</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Ensures that the scanner container is not run in privileged mode</td>
        </tr>
        <tr>
            <td>scanner.securityContext.readOnlyRootFilesystem</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>Prevents write access to the containers file system</td>
        </tr>
        <tr>
            <td>scanner.securityContext.runAsNonRoot</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>Enforces that the scanner image is run as a non root user</td>
        </tr>
        <tr>
            <td>scanner.suspend</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>if set to true the scan job will be suspended after creation. You can then resume the job using `kubectl resume <jobname>` or using a job scheduler like kueue</td>
        </tr>
        <tr>
            <td>scanner.tolerations</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional tolerations settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)</td>
        </tr>
        <tr>
            <td>scanner.ttlSecondsAfterFinished</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>seconds after which the Kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/</td>
        </tr>
    </tbody>
</table>

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

