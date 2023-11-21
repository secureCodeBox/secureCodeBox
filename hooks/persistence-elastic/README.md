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
| https://helm.elastic.co | elasticsearch | 7.17.3 |
| https://helm.elastic.co | kibana | 7.17.3 |

## Additional Chart Configurations

### Elasticsearch Indexing

For the elasticsearch `indexSuffix` you can provide a date format pattern. We use [Luxon](https://moment.github.io/luxon/) to format the date. So checkout
the [Luxon documentation](https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens) to see what kind of format patterns you can use for the
`indexSuffix`. Default pattern is `yyyy-MM-dd`

<table>
    <thead>
        <th>Key</th>
        <th>Type</th>
        <th class="default-column">Default</th>
        <th>Description</th>
    </thead>
    <tbody>
        <tr>
            <td>affinity</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>authentication</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"apiKeySecret":null,"userSecret":null}`
</pre></td>
            <td>Configure authentication schema and credentials the persistence provider should use to connect to elasticsearch user and apikey are mutually exclusive, only set one!</td>
        </tr>
        <tr>
            <td>authentication.apiKeySecret</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>Link a pre-existing generic secret with `id` and `key` key / value pairs</td>
        </tr>
        <tr>
            <td>authentication.userSecret</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>Link a pre-existing generic secret with `username` and `password` key / value pairs</td>
        </tr>
        <tr>
            <td>dashboardImporter.enabled</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>Enable if you want to import some example kibana dashboards for secureCodeBox findings analytics.</td>
        </tr>
        <tr>
            <td>dashboardImporter.image.repository</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"securecodebox/persistence-elastic-dashboard-importer"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>dashboardImporter.image.tag</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>elasticsearch</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"enabled":true,"minimumMasterNodes":1,"replicas":1}`
</pre></td>
            <td>Configures the included elasticsearch subchart (see: https://github.com/elastic/helm-charts/tree/elasticsearch)</td>
        </tr>
        <tr>
            <td>elasticsearch.enabled</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>Enable if you want to deploy an elasticsearch service.</td>
        </tr>
        <tr>
            <td>elasticsearch.minimumMasterNodes</td>
            <td>int</td>
            <td class="default-column">
<pre lang="yaml">

    `1`
</pre></td>
            <td>The value for discovery.zen.minimum_master_nodes. Should be set to (master_eligible_nodes / 2) + 1. Ignored in Elasticsearch versions >= 7</td>
        </tr>
        <tr>
            <td>elasticsearch.replicas</td>
            <td>int</td>
            <td class="default-column">
<pre lang="yaml">

    `1`
</pre></td>
            <td>Kubernetes replica count for the StatefulSet (i.e. how many pods)</td>
        </tr>
        <tr>
            <td>externalElasticStack.elasticsearchAddress</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"https://elasticsearch.example.com"`
</pre></td>
            <td>The URL of the elasticsearch service to persists all findings to.</td>
        </tr>
        <tr>
            <td>externalElasticStack.enabled</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Enable this when you already have an Elastic Stack running to which you want to send your results</td>
        </tr>
        <tr>
            <td>externalElasticStack.kibanaAddress</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"https://kibana.example.com"`
</pre></td>
            <td>The URL of the kibana service used to visualize all findings.</td>
        </tr>
        <tr>
            <td>fullnameOverride</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `""`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>hook.affinity</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Optional affinity settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/)</td>
        </tr>
        <tr>
            <td>hook.env</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional environment variables mapped into the hook (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)</td>
        </tr>
        <tr>
            <td>hook.extraVolumeMounts</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional VolumeMounts mapped into the hook (see: https://kubernetes.io/docs/concepts/storage/volumes/)</td>
        </tr>
        <tr>
            <td>hook.extraVolumes</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional Volumes mapped into the hook (see: https://kubernetes.io/docs/concepts/storage/volumes/)</td>
        </tr>
        <tr>
            <td>hook.image.repository</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"docker.io/securecodebox/hook-persistence-elastic"`
</pre></td>
            <td>Hook image repository</td>
        </tr>
        <tr>
            <td>hook.image.tag</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    defaults to the charts version
</pre></td>
            <td>The image Tag defaults to the charts version if not defined.</td>
        </tr>
        <tr>
            <td>hook.labels</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Add Kubernetes Labels to the hook definition</td>
        </tr>
        <tr>
            <td>hook.priority</td>
            <td>int</td>
            <td class="default-column">
<pre lang="yaml">

    `0`
</pre></td>
            <td>Hook priority. Higher priority Hooks are guaranteed to execute before low priority Hooks.</td>
        </tr>
        <tr>
            <td>hook.resources</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

   
</pre></td>
            <td>Optional resources lets you control resource limits and requests for the hook container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/</td>
        </tr>
        <tr>
            <td>hook.tolerations</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td>Optional tolerations settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)</td>
        </tr>
        <tr>
            <td>hook.ttlSecondsAfterFinished</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>Seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/</td>
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
            <td>indexAppendNamespace</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>Define if the name of the namespace where this hook is deployed to must be added to the index name. The namespace can be used to separate index by tenants (namespaces).</td>
        </tr>
        <tr>
            <td>indexPrefix</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"scbv2"`
</pre></td>
            <td>Define a specific index prefix used for all elasticsearch indices.</td>
        </tr>
        <tr>
            <td>indexSuffix</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"“yyyy-MM-dd”"`
</pre></td>
            <td>Define a specific index suffix based on date pattern (YEAR (yyyy), MONTH (yyyy-MM), WEEK (yyyy-'W'W), DATE (yyyy-MM-dd)). We use Luxon for date formatting (https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens)</td>
        </tr>
        <tr>
            <td>kibana</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"enabled":true}`
</pre></td>
            <td>Configures included Elasticsearch subchart</td>
        </tr>
        <tr>
            <td>kibana.enabled</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>Enable if you want to deploy an kibana service (see: https://github.com/elastic/helm-charts/tree/master/kibana)</td>
        </tr>
        <tr>
            <td>nameOverride</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `""`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>nodeSelector</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>podSecurityContext</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>resources</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>securityContext</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>tolerations</td>
            <td>list</td>
            <td class="default-column">
<pre lang="yaml">

    `[]`
</pre></td>
            <td></td>
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
[elastic.io]: https://www.elastic.co/products/elasticsearch
