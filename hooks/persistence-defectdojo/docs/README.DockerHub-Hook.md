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
This `hook` image is intended to work in combination with other `parser` images to read or manipulate `findings` results. For more information details please take a look at the [project page][scb-docs] or [documentation page][https://www.securecodebox.io/docs/hooks/defectdojo].

```bash
docker pull securecodebox/hook-persistence-defectdojo
```

## What is "Persistence DefectDojo" Hook about?
The DefectDojo hook imports the reports from scans automatically into [OWASP DefectDojo](https://www.defectdojo.org/).
The hook uses the import scan [API v2 from DefectDojo](https://defectdojo.readthedocs.io/en/latest/api-v2-docs.html) to import the scan results.

Scan types which are both supported by the _secureCodeBox_ and DefectDojo benefit from the full feature set of DefectDojo,
like deduplication. These scan types are (see up-to-date list in [Java source][dd-scan-types-src]):

- Nmap
- Nikto
- ZAP (Baseline, API Scan and Full Scan)
- ZAP Advanced
- SSLyze
- Trivy
- Gitleaks
- Semgrep

After uploading the results to DefectDojo, it will use the findings parsed by _DefectDojo_ to overwrite the original _secureCodeBox_ findings identified by the parser. This lets you access the finding metadata like the false positive and duplicate status from _DefectDojo_ in further ReadOnly hooks, e.g. send out Slack notification for non-duplicate & non-false positive findings only.

:::warning
This hook reads only from _raw findings_ and **not** from _secureCodeBox findings_. Because _DefectDojo_ does a way better job on parsing the findings itself, instead of parsing our _secureCodeBox finding_ format with the _generic scan type_. If you want to modify a finding before it is imported into _DefectDojo_ you can write a custom [post-processing hook](/docs/how-tos/hooks) which operates on the _raw findings_.
:::

For scan types which are not supported by _DefectDojo_, the generic importer is used, which will result in a less sophisticated display of the results and fewer features inside _DefectDojo_. In the worst case, it can lead to some findings being lost - see the note below.

:::caution
Be careful when using the _DefectDojo Hook_ in combination with other _ReadAndWrite Hooks_. By default, the _secureCodeBox_ makes no guarantees about the execution order of multiple ReadAndWrite hooks, they can be executed in any order. This can lead to "lost update" problems as the _DefectDojo_ hook will overwrite all findings, which disregards the results of previously run ReadAndWrite hooks. ReadOnly hooks work fine with the _DefectDojo_ hook as they are always executed after ReadAndWrite Hooks. If you want to control the order of execution of the different hooks, take a look at the [hook priority documentation](https://www.securecodebox.io/docs/how-tos/hooks#hook-order) (supported with secureCodeBox 3.4.0 and later).
:::

:::caution
The _DefectDojo_ hook will send all scan results to _DefectDojo_, including those for which _DefectDojo_ does not have native support. In this case, _DefectDojo_ may incorrectly deduplicate findings, which can in some cases [lead to incomplete imports and even data loss](https://github.com/DefectDojo/django-DefectDojo/issues/5312). You can set the hook to read-only mode, which will prevent it from writing the results back to _secureCodeBox_ (`--set defectdojo.syncFindingsBack=false` during installation of the hook) if you want to rule out any data loss inside _secureCodeBox_, but this will not prevent the incorrect deduplication from affecting the data you see inside _DefectDojo_ (for this, you will need to [contribute a parser to DefectDojo](https://defectdojo.github.io/django-DefectDojo/contributing/how-to-write-a-parser/)). You can also selectively disable the _DefectDojo_ hook for certain scans using the [hook selector feature](https://www.securecodebox.io/docs/how-tos/hooks#hook-selector) (supported with _secureCodeBox_ 3.4.0 and later).
:::

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
[dd-scan-types-src]:  https://github.com/secureCodeBox/secureCodeBox/blob/main/hooks/persistence-defectdojo/hook/src/main/java/io/securecodebox/persistence/util/ScanNameMapping.java
