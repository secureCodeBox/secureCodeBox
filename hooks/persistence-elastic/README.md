---
title: "Elasticsearch"
category: "hook"
type: "persistenceProvider"
state: "released"
usecase: "Publishes all Scan Findings to Elasticsearch."
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

## What is "Persistence ElasticSearch" Hook about?
The ElasticSearch persistenceProvider hook saves all findings and reports into the configured ElasticSearch index. This allows for some easy searching and visualization of the findings. To learn more about Elasticsearch visit [elastic.io].

Installing the Elasticsearch persistenceProvider hook will add a _ReadOnly Hook_ to your namespace.

## Deployment
The persistence-elastic chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install persistence-elastic secureCodeBox/persistence-elastic
```

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
| dashboardImporter.enabled | bool | `true` | Enable if you want to import some example kibana dashboards for secureCodeBox findings analytics. |
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
| hook.affinity | object | `{}` | Optional affinity settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| hook.image.repository | string | `"docker.io/securecodebox/hook-persistence-elastic"` | Hook image repository |
| hook.image.tag | string | defaults to the charts version | The image Tag defaults to the charts version if not defined. |
| hook.labels | object | `{}` | Add Kubernetes Labels to the hook definition |
| hook.priority | int | `0` | Hook priority. Higher priority Hooks are guaranteed to execute before low priority Hooks. |
| hook.resources | object | { requests: { cpu: "200m", memory: "100Mi" }, limits: { cpu: "400m", memory: "200Mi" } } | Optional resources lets you control resource limits and requests for the hook container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ |
| hook.tolerations | list | `[]` | Optional tolerations settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| hook.ttlSecondsAfterFinished | string | `nil` | Seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| imagePullSecrets | list | `[]` | Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/) |
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
[scb-docs]: https://www.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
[elastic.io]: https://www.elastic.co/products/elasticsearch
