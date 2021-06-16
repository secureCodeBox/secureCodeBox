<!--
SPDX-FileCopyrightText: 2020 iteratec GmbH

SPDX-License-Identifier: Apache-2.0
-->
<!--
.: IMPORTANT! :.
--------------------------
This file is generated automaticaly with `helm-docs` based on the following template files:
- ./.helm-docs/templates.gotmpl (general template data for all charts)
- ./chart-folder/.helm-docs.gotmpl (chart specific template data)

Please be aware of that and apply your changes only within those template files instead of this file.
Otherwise your changes will be reverted/overriden automaticaly due to the build process `./.github/workflows/helm-docs.yaml`
--------------------------
-->

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

## What is "Persistence DefectDojo" Hook about?
The DefectDojo hook imports the reports from scans automatically into [OWASP DefectDojo](https://www.defectdojo.org/).
The hook uses the import scan [API v2 from DefectDojo](https://defectdojo.readthedocs.io/en/latest/api-v2-docs.html) to import the scan results.

This means that only scan types are supported by the hook which are both supported by the secureCodeBox and DefectDojo.
These are:

- Nmap
- Nikto
- ZAP (Baseline, API Scan and Full Scan)
- ZAP Advanced
- SSLyze
- Trivy
- Gitleaks

After uploading the results to DefectDojo, it will use the findings parsed by DefectDojo to overwrite the
original secureCodeBox findings identified by the parser. This lets you access the finding metadata like the false
positive and duplicate status from DefectDojo in further ReadOnly hooks, e.g. send out Slack notification
for non-duplicate & non-false positive findings only.

:::caution

Be careful when using the DefectDojo Hook in combination with other ReadAndWrite hooks. The secureCodeBox currently has
no way to guarantee that one ReadAndWrite hook gets executed before another ReadAndWrite hook. This can lead to
"lost update" problems as the DefectDojo hook will overwrite all findings, which disregards the results of previously
run ReadAndWrite hooks.
ReadOnly hooks work fine with the DefectDojo hook as they are always executed after ReadAndWrite Hooks.
:::

## Deployment
The persistence-defectdojo `scanType` can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install persistence-defectdojo secureCodeBox/persistence-defectdojo
```

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

## Additional Chart Configurations

Installing the DefectDojo persistenceProvider hook will add a _ReadOnly Hook_ to your namespace.

```bash
kubectl create secret generic defectdojo-credentials --from-literal="username=admin" --from-literal="apikey=08b7..."

helm upgrade --install dd secureCodeBox/persistence-defectdojo \
    --set="defectdojo.url=https://defectdojo-django.default.svc"
```

The hook will automatically import the scan results into an engagement in DefectDojo.
If the engagement doesn't exist the hook will create the engagement (CI/CD engagement) and all objects required for it
(product & product type).

You don't need any configuration for that to work, the hook will infer engagement & product names from the scan name.
If you want more control over the names or add additional meta information like the version of the tested software you
can add these via annotation to the scan. See examples below.

| Scan Annotation                                                    | Description                | Default if not set                                                   | Notes                                                                                 |
| ------------------------------------------------------------------ | -------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `defectdojo.securecodebox.io/product-type-name`                    | Name of the Product Type   | Product Type with ID 1 (typically "Research and Development")        | Product Type will be automatically created if no Product Type under that name exists  |
| `defectdojo.securecodebox.io/product-name`                         | Name of the Product        | ScheduledScan Name if Scheduled, Scan Name if it's a standalone Scan | Product will be automatically created if no Product under that name exists            |
| `defectdojo.securecodebox.io/product-description`                  | Description of the Product | Empty String                                                         | Only used when creating the Product not used for updating                             |
| `defectdojo.securecodebox.io/product-tags`                         | Product Tags               | Nothing                                                              | Only used when creating the Product not used for updating                             |
| `defectdojo.securecodebox.io/engagement-name`                      | Name of the Engagement     | Scan Name                                                            | Will be automatically created if no *engagement* with that name **and** version exists |
| `defectdojo.securecodebox.io/engagement-version`                   | Engagement Version         | Nothing                                                              |                                                                                       |
| `defectdojo.securecodebox.io/engagement-deduplicate-on-engagement` | Deduplicate On Engagement  | false                                                                | Only used when creating the Engagement not used for updating                          |
| `defectdojo.securecodebox.io/engagement-tags`                      | Engagement Tags            | Nothing                                                              | Only used when creating the Engagement not used for updating                          |
| `defectdojo.securecodebox.io/test-title`                           | Test Title                 | Scan Name                                                            |                                                                                       |

### Simple Example Scans

This will import the results daily into an engagements called: "zap-juiceshop-$UNIX_TIMESTAMP" (Name of the Scan created daily by the ScheduledScan), in a Product called: "zap-juiceshop" in the default DefectDojo product type.

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: ScheduledScan
metadata:
  name: "zap-juiceshop"
spec:
  interval: 24h
  scanSpec:
    scanType: "zap-full-scan"
    parameters:
      - "-t"
      - "http://juice-shop.demo-apps.svc:3000"
```

### Complete Example Scan

This will import the results into engagement, product and product type following the labels.
The engagement will be reused by the hook for the daily scans / imports until the engagement version is increased.

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: ScheduledScan
metadata:
  name: "zap-full-scan-juiceshop"
  annotations:
    defectdojo.securecodebox.io/product-type-name: "OWASP"
    defectdojo.securecodebox.io/product-name: "Juice Shop"
    defectdojo.securecodebox.io/product-description: |
      OWASP Juice Shop is probably the most modern and sophisticated insecure web application!
      It can be used in security trainings, awareness demos, CTFs and as a guinea pig for security tools!
      Juice Shop encompasses vulnerabilities from the entire OWASP Top Ten along with many other security flaws found in real-world applications!
    defectdojo.securecodebox.io/product-tags: vulnerable,appsec,owasp-top-ten,vulnapp
    defectdojo.securecodebox.io/engagement-name: "Juice Shop"
    defectdojo.securecodebox.io/engagement-version: "v12.6.1"
    defectdojo.securecodebox.io/engagement-tags: "automated,daily"
    defectdojo.securecodebox.io/engagement-deduplicate-on-engagement: "true"
    defectdojo.securecodebox.io/test-title: "Juice Shop - v12.6.1"
spec:
  interval: 24h
  scanSpec:
    scanType: "zap-full-scan"
    parameters:
      - "-t"
      - "http://juice-shop.demo-apps.svc:3000"
```

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| defectdojo.authentication.apiKeyKey | string | `"apikey"` | Name of the apikey key in the `userSecret` secret. Use this if you already have a secret with different key / value pairs |
| defectdojo.authentication.userSecret | string | `"defectdojo-credentials"` | Link a pre-existing generic secret with `username` and `apikey` key / value pairs |
| defectdojo.authentication.usernameKey | string | `"username"` | Name of the username key in the `userSecret` secret. Use this if you already have a secret with different key / value pairs |
| defectdojo.syncFindingsBack | bool | `true` | Syncs back (two way sync) all imported findings from DefectDojo to SCB Findings Store, set to false to only import the findings to DefectDojo (one way sync). |
| defectdojo.url | string | `"http://defectdojo-django.default.svc"` | Url to the DefectDojo Instance |
| image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| image.repository | string | `"docker.io/securecodebox/persistence-defectdojo"` | Hook image repository |
| image.tag | string | `nil` | Container image tag |

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://docs.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
