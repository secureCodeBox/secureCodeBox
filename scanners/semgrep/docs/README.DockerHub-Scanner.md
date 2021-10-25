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

## What is OWASP secureCodeBox?

<p align="center">
  <img alt="secureCodeBox Logo" src="https://docs.securecodebox.io/img/Logo_Color.svg" width="250px"/>
</p>

_[OWASP secureCodeBox][scb-github]_ is an automated and scalable open source solution that can be used to integrate various *security vulnerability scanners* with a simple and lightweight interface. The _secureCodeBox_ mission is to support *DevSecOps* Teams to make it easy to automate security vulnerability testing in different scenarios.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The secureCodeBox project is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. It is also possible to start the different integrated security vulnerability scanners based on a docker infrastructure.

### Quickstart with secureCodeBox on kubernetes

You can find resources to help you get started on our [documentation website](https://docs.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://docs.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://docs.securecodebox.io/docs/getting-started/first-scans) with it.

## Supported Tags
- `latest`  (represents the latest stable release build)
- tagged releases, e.g. `0.70.0`

## How to use this image
This `scanner` image is intended to work in combination with the corresponding `parser` image to parse the scanner `findings` to generic secureCodeBox results. For more information details please take a look at the [project page][scb-docs] or [documentation page][https://docs.securecodebox.io/docs/scanners/semgrep].

```bash
docker pull securecodebox/scanner-semgrep
```

## What is Semgrep?
Semgrep ("semantic grep") is a static source code analyzer that can be used to search for specific patterns in code.
It allows you to either [write your own rules](https://semgrep.dev/learn), or use one of the [many pre-defined rulesets](https://semgrep.dev/r) curated by the semgrep team.

To learn more about semgrep, visit [semgrep.dev](https://semgrep.dev).

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

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [Slack][scb-slack]
- [Twitter][scb-twitter]

secureCodeBox is an official [OWASP][scb-owasp] project.

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).

As for any pre-built image usage, it is the image user's responsibility to ensure that any use of this image complies with any relevant licenses for all software contained within.

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://docs.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE

