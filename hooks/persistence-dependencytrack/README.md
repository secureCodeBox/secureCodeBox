---
title: "Dependency-Track"
category: "hook"
type: "persistenceProvider"
state: "developing"
usecase: "Publishes all CycloneDX SBOMs to Dependency-Track."
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

## What is "Persistence Dependency-Track" Hook about?
The Dependency-Track persistenceProvider hook saves all generated CycloneDX SBOMs into the configured [OWASP Dependency-Track][dependencytrack.org] instance, other findings or SPDX SBOMs cannot be handled and are ignored.
This allows automatically cataloging infrastructure to gain an overview over the used components and dependencies.
To learn more about Dependency-Track visit [dependencytrack.org].

To use the _secureCodeBox_ to generate SBOMs, you can use the [Trivy-SBOM scanner][trivy-sbom].

## Deployment
The persistence-dependencytrack chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install persistence-dependencytrack secureCodeBox/persistence-dependencytrack
```

## Requirements

Kubernetes: `>=v1.11.0-0`

## Additional Chart Configurations

Installing the Dependency-Track persistenceProvider hook will add a _ReadOnly Hook_ to your namespace.

You need to provide the API key to connect to Dependency-Track as a [Kubernetes secret][k8ssecret].
Check the [Dependency-Track documentation][dt-api-docs], to learn how to configure an API key.

```bash
kubectl create secret generic dependencytrack-credentials --from-literal="apikey=NoEs..."

helm upgrade --install dt secureCodeBox/persistence-dependencytrack \
    --set="dependencytrack.url=https://dependency-track-backend.default.svc"
```

SBOMs are imported for a project in Dependency-Track.
To avoid configuring all of them by hand first and assigning projects to scans somehow, the hook automatically detects name and version from the scan and then creates Dependency-Track projects if they do not exist yet.
This requires either the `PORTFOLIO_MANAGEMENT` or `PROJECT_CREATION_UPLOAD` permission for the API key which gets used by the hook (or rather for the team the key is defined for).

The hook extracts name and version from the reference of the scanned docker image.
For more fine grained control how the projects are matched, you can configure the name and version as annotations to the scan.

| Scan Annotation                                    | Description            | Default if not set                                                              |
| -------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------- |
| `dependencytrack.securecodebox.io/project-name`    | Name of the Project    | Repository Name of the Docker Image                                             |
| `dependencytrack.securecodebox.io/project-version` | Version of the Project | Image Tag if avialable, otherwise Image Digest if available, otherwise `latest` |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| dependencytrack.authentication | object | `{"apiKeyKey":"apikey","userSecret":"dependencytrack-credentials"}` | Authentication information. Dependency-Track expects an API key, which can be generated for a team (see: https://docs.dependencytrack.org/integrations/rest-api/). The hook automatically creates missing projects, for that either the PORTFOLIO_MANAGEMENT or PROJECT_CREATION_UPLOAD permission is required. |
| dependencytrack.authentication.apiKeyKey | string | `"apikey"` | Name of the apikey key in the `userSecret` secret. |
| dependencytrack.authentication.userSecret | string | `"dependencytrack-credentials"` | Link a pre-existing generic secret with `apikey` key / value pair |
| dependencytrack.url | string | `"http://dependency-track-backend.default.svc"` | Url to the Dependency-Track instance, make sure to use the backend url |
| hook.affinity | object | `{}` | Optional affinity settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| hook.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| hook.image.repository | string | `"docker.io/securecodebox/hook-persistence-dependencytrack"` | Hook image repository |
| hook.image.tag | string | defaults to the charts version | Container image tag |
| hook.labels | object | `{}` | Add Kubernetes Labels to the hook definition |
| hook.priority | int | `0` | Hook priority. Higher priority Hooks are guaranteed to execute before low priority Hooks. |
| hook.resources | object | `{ requests: { cpu: "200m", memory: "100Mi" }, limits: { cpu: "400m", memory: "200Mi" } }` | Optional resources lets you control resource limits and requests for the hook container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ |
| hook.tolerations | list | `[]` | Optional tolerations settings that control how the hook job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| hook.ttlSecondsAfterFinished | string | `nil` | Seconds after which the kubernetes job for the hook will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| imagePullSecrets | list | `[]` | Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/) |

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://www.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://owasp.org/slack/invite
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
[dependencytrack.org]: https://dependencytrack.org/
[dt-api-docs]: https://docs.dependencytrack.org/integrations/rest-api/
[k8ssecret]: https://kubernetes.io/docs/concepts/configuration/secret/
[trivy-sbom]: https://www.securecodebox.io/docs/scanners/trivy-sbom
