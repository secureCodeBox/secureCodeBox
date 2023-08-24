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

Scan types which are both supported by the secureCodeBox and DefectDojo benefit from the full feature set of DefectDojo,
like deduplication. These scan types are:

- Nmap
- Nikto
- ZAP (Baseline, API Scan and Full Scan)
- ZAP Advanced
- SSLyze
- Trivy
- Gitleaks
- Semgrep

After uploading the results to DefectDojo, it will use the findings parsed by DefectDojo to overwrite the
original secureCodeBox findings identified by the parser. This lets you access the finding metadata like the false
positive and duplicate status from DefectDojo in further ReadOnly hooks, e.g. send out Slack notification
for non-duplicate & non-false positive findings only.

For scan types which are not supported by DefectDojo, the generic importer is used, which will result in a less
sophisticated display of the results and fewer features inside DefectDojo. In the worst case, it can lead to some
findings being lost - see the note below.

:::caution

Be careful when using the DefectDojo Hook in combination with other ReadAndWrite hooks. By default, the secureCodeBox
makes no guarantees about the execution order of multiple ReadAndWrite hooks, they can be executed in any order.
This can lead to "lost update" problems as the DefectDojo hook will overwrite all findings, which disregards the
results of previously run ReadAndWrite hooks. ReadOnly hooks work fine with the DefectDojo hook as they are always
executed after ReadAndWrite Hooks. If you want to control the order of execution of the different hooks, take a look
at the [hook priority documentation](https://www.securecodebox.io/docs/how-tos/hooks#hook-order) (supported with
secureCodeBox 3.4.0 and later).
:::

:::caution

The DefectDojo hook will send all scan results to DefectDojo, including those for which DefectDojo does not
have native support. In this case, DefectDojo may incorrectly deduplicate findings, which can in some cases
[lead to incomplete imports and even data loss](https://github.com/DefectDojo/django-DefectDojo/issues/5312).
You can set the hook to read-only mode, which will prevent it from writing the results back to secureCodeBox
(`--set defectdojo.syncFindingsBack=false` during installation of the hook) if you want to rule out any data
loss inside secureCodeBox, but this will not prevent the incorrect deduplication from affecting the data you
see inside DefectDojo (for this, you will need to [contribute a parser to DefectDojo](https://defectdojo.github.io/django-DefectDojo/contributing/how-to-write-a-parser/)).
You can also selectively disable the DefectDojo hook for certain scans using the [hook selector feature](https://www.securecodebox.io/docs/how-tos/hooks#hook-selector)
(supported with secureCodeBox 3.4.0 and later).
:::

### Running "Persistence DefectDojo" Hook Locally from Source
For development purposes, it can be useful to run this hook locally. You can do so by following these steps:

1. Make sure you have access to a running [DefectDojo](https://github.com/DefectDojo/django-DefectDojo) instance.
2. [Run a Scan](https://www.securecodebox.io/docs/getting-started/first-scans) of your choice.
3. Supply Download Links for the Scan Results (Raw Result and Findings.json). You can access them from the
included [Minio Instance](https://www.securecodebox.io/docs/getting-started/installation/#accessing-the-included-minio-instance)
and upload them to a GitHub Gist.
4. Set the following environment variables:

- DEFECTDOJO_URL (e.g http://192.168.0.1:8080);
- DEFECTDOJO_USERNAME (e.g admin)
- DEFECTDOJO_APIKEY= (e.g. b09c.., can be fetched from the DefectDojo API information page)
- IS_DEV=true
- SCAN_NAME (e.g nmap-scanme.nmap.org, must be set exactly to the name of the scan used in step 2)

5. Build the jar with gradle and run it with the following CLI arguments: {Raw Result Download URL} {Findings Download URL} {Raw Result Upload URL} {Findings Upload URL}.
See the code snippet below. You have to adjust the filename of the jar for other versions than the '0.1.0-SNAPSHOT'.
Also you will need to change the download URLs for the Raw Result and Findings to the ones from Step 3.

```bash
./gradlew build
java -jar build/libs/defectdojo-persistenceprovider-0.1.0-SNAPSHOT.jar https://gist.githubusercontent.com/.../scanme-nmap-org.xml https://gist.githubusercontent.com/.../nmap-findings.json https://httpbin.org/put https://httpbin.org/put
```

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
[scb-docs]: https://www.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE

