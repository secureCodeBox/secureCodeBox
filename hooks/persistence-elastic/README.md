---
title: "Elasticsearch"
category: "hook"
type: "persistenceProvider"
state: "released"
usecase: "Publishes all Scan Findings to Elasticsearch."
---

<!-- end -->

## About
The ElasticSearch persistenceProvider hook saves all findings and reports into the configured ElasticSearch index. This allows for some easy searching and visualization of the findings. To learn more about Elasticsearch visit [elastic.io].

## Deployment

Installing the Elasticsearch persistenceProvider hook will add a _ReadOnly Hook_ to your namespace.

```bash
helm upgrade --install elkh secureCodeBox/persistence-elastic
```

## Elasticsearch Indexing

For the elasticsearch `indexSuffix` you can provide a date format pattern. We use [Luxon](https://moment.github.io/luxon/) to format the date. So checkout
the [Luxon documentation](https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens) to see what kind of format patterns you can use for the
`indexSuffix`. Default pattern is `yyyy-MM-dd`

## Chart Configuration

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
| hook.image.repository | string | `"docker.io/securecodebox/persistence-elastic"` | Hook image repository |
| hook.image.tag | string | defaults to the charts version | The image Tag defaults to the charts version if not defined. |
| hook.ttlSecondsAfterFinished | string | `nil` | Seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
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

[elastic.io]: https://www.elastic.co/products/elasticsearch
