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

## What is "Persistence ElasticSearch" Hook about?
The ElasticSearch persistenceProvider hook saves all findings and reports into the configured ElasticSearch index. This allows for some easy searching and visualization of the findings. To learn more about Elasticsearch visit [elastic.io].

Installing the Elasticsearch persistenceProvider hook will add a _ReadOnly Hook_ to your namespace.

## Deployment
The persistence-elastic `scanType` can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install persistence-elastic secureCodeBox/persistence-elastic
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

| Repository | Name | Version |
|------------|------|---------|
| https://helm.elastic.co | elasticsearch | 7.9.2 |
| https://helm.elastic.co | kibana | 7.9.2 |

## Additional Chart Configurations

### Elasticsearch Indexing

For the elasticsearch `indexSuffix` you can provide a date format pattern. We use [Luxon](https://moment.github.io/luxon/) to format the date. So checkout
the [Luxon documentation](https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens) to see what kind of format patterns you can use for the
`indexSuffix`. Default pattern is `yyyy-MM-dd`

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` |  |
| authentication | object | `{"apiKeySecret":null,"userSecret":null}` | Configure authentication schema and credentials the persistence provider should use to connect to elasticsearch user and apikey are mutually exclusive, only set one! |
| authentication.apiKeySecret | string | `nil` | Link a pre-existing generic secret with `id` and `key` key / value pairs |
| authentication.userSecret | string | `nil` | Link a pre-existing generic secret with `username` and `password` key / value pairs |
| dashboardImporter.image.repository | string | `"securecodebox/persistence-elastic-dashboard-importer"` |  |
| dashboardImporter.image.tag | string | `nil` |  |
| elasticsearch | object | `{"enabled":true,"minimumMasterNodes":1,"replicas":1}` | Configures the included elasticsearch subchart (see: https://github.com/elastic/helm-charts/tree/elasticsearch) |
| elasticsearch.enabled | bool | `true` | Enable if you want to deploy an elasticsearch service. |
| elasticsearch.minimumMasterNodes | int | `1` | The value for discovery.zen.minimum_master_nodes. Should be set to (master_eligible_nodes / 2) + 1. Ignored in Elasticsearch versions >= 7 |
| elasticsearch.replicas | int | `1` | Kubernetes replica count for the StatefulSet (i.e. how many pods) |
| externalElasticStack.elasticsearchAddress | string | `"https://elasticsearch.example.com"` | The URL of the elasticsearch service to persists all findings to. |
| externalElasticStack.enabled | bool | `false` | Enable this when you already have an Elastic Stack running to which you want to send your results |
| externalElasticStack.kibanaAddress | string | `"https://kibana.example.com"` | The URL of the kibana service used to visualize all findings. |
| fullnameOverride | string | `""` |  |
| hookJob.ttlSecondsAfterFinished | string | `nil` | Seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| image.repository | string | `"docker.io/securecodebox/persistence-elastic"` | Image repository for the dashboard importer job |
| image.tag | string | defaults to the charts version | Image tag for the dashboard importer job |
| imagePullSecrets | list | `[]` |  |
| indexAppendNamespace | bool | `true` | Define if the name of the namespace where this hook is deployed to must be added to the index name. The namespace can be used to separate index by tenants (namespaces). |
| indexPrefix | string | `"scbv2"` | Define a specific index prefix used for all elasticsearch indices. |
| indexSuffix | string | `"“yyyy-MM-dd”"` | Define a specific index suffix based on date pattern (YEAR (yyyy), MONTH (yyyy-MM), WEEK (yyyy-'W'W), DATE (yyyy-MM-dd)). We use Luxon for date formatting (https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens) |
| kibana | object | `{"enabled":true}` | Configures included Elasticsearch subchart |
| kibana.enabled | bool | `true` | Enable if you want to deploy an kibana service (see: https://github.com/elastic/helm-charts/tree/master/kibana) |
| nameOverride | string | `""` |  |
| nodeSelector | object | `{}` |  |
| podSecurityContext | object | `{}` |  |
| resources | object | `{}` |  |
| securityContext | object | `{}` |  |
| tolerations | list | `[]` |  |

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
[elastic.io]: https://www.elastic.co/products/elasticsearch