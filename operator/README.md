---
title: "secreCodeBox Operator"
category: "core"
type: "Operator"
state: "released"
appVersion: ""
usecase: "secureCodeBox Operator is the core component."
---

![operator logo](https://www.securecodebox.io/img/Logo_Color.svg)

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

## What is secureCodeBox Operator?
The secureCodeBox operator is running on Kubernetes and is the core component of the complete secureCodeBox stack, responsible for managing all scans and resources.

**Homepage:** <https://www.securecodebox.io/docs/getting-started/installation>

## Deployment
The operator chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install operator secureCodeBox/operator
```

## Requirements

Kubernetes: `>=v1.11.0-0`

| Repository | Name | Version |
|------------|------|---------|
| https://charts.bitnami.com/bitnami | minio | 11.9.4 |

## Deployment

The secureCodeBox Operator can be deployed via helm:

```bash
# Add the secureCodeBox Helm Repo
helm repo add secureCodeBox https://charts.securecodebox.io
# Create a new namespace for the secureCodeBox Operator
kubectl create namespace securecodebox-system
# Install the Operator & CRDs
helm install securecodebox-operator secureCodeBox/operator
```

<table>
    <thead>
        <th>Key</th>
        <th>Type</th>
        <th class="default-column">Default</th>
        <th>Description</th>
    </thead>
    <tbody>
        <tr>
            <td>customCACertificate</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"certificate":"public.crt","existingCertificate":null}`
</pre></td>
            <td>Setup for Custom CA certificates. These are automatically mounted into every secureCodeBox component (lurker, parser & hooks). Requires that every namespace has a configmap with the CA certificate(s)</td>
        </tr>
        <tr>
            <td>customCACertificate.certificate</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"public.crt"`
</pre></td>
            <td>key in the configmap holding the certificate(s)</td>
        </tr>
        <tr>
            <td>customCACertificate.existingCertificate</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td>name of the configMap holding the ca certificate(s), needs to be the same across all namespaces</td>
        </tr>
        <tr>
            <td>image.pullPolicy</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"IfNotPresent"`
</pre></td>
            <td>Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images</td>
        </tr>
        <tr>
            <td>image.repository</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"docker.io/securecodebox/operator"`
</pre></td>
            <td>The operator image repository</td>
        </tr>
        <tr>
            <td>image.tag</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    defaults to the charts version
</pre></td>
            <td>Parser image tag</td>
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
            <td>lurker.image.pullPolicy</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"IfNotPresent"`
</pre></td>
            <td>Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images</td>
        </tr>
        <tr>
            <td>lurker.image.repository</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"docker.io/securecodebox/lurker"`
</pre></td>
            <td>The operator image repository</td>
        </tr>
        <tr>
            <td>lurker.image.tag</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    defaults to the charts version
</pre></td>
            <td>Parser image tag</td>
        </tr>
        <tr>
            <td>minio</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"auth":{"rootPassword":"password","rootUser":"admin"},"defaultBuckets":"securecodebox","enabled":true,"resources":{"requests":{"memory":"256Mi"}},"tls":{"enabled":false}}`
</pre></td>
            <td>Minio default config. More config options an info: https://github.com/minio/minio/blob/master/helm/minio/values.yaml</td>
        </tr>
        <tr>
            <td>minio.enabled</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>Enable this to use minio as storage backend instead of a cloud bucket provider like AWS S3, Google Cloud Storage, DigitalOcean Spaces etc.</td>
        </tr>
        <tr>
            <td>podSecurityContext</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Sets the securityContext on the operators pod level. See: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-container</td>
        </tr>
        <tr>
            <td>presignedUrlExpirationTimes</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"hooks":"1h","parsers":"1h","scanners":"12h"}`
</pre></td>
            <td>Duration how long presigned urls are valid</td>
        </tr>
        <tr>
            <td>resources</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"limits":{"cpu":"100m","memory":"30Mi"},"requests":{"cpu":"100m","memory":"20Mi"}}`
</pre></td>
            <td>CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/)</td>
        </tr>
        <tr>
            <td>s3.authType</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"access-secret-key"`
</pre></td>
            <td>Authentication method. Supports access-secret-key (used by most s3 endpoint) and aws-irsa (Used by AWS EKS IAM Role to Kubenetes Service Account Binding. Support for AWS IRSA is considered experimental in the secureCodeBox)</td>
        </tr>
        <tr>
            <td>s3.awsStsEndpoint</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"https://sts.amazonaws.com"`
</pre></td>
            <td>STS Endpoint used in AWS IRSA Authentication. Change this to the sts endpoint of your aws region. Only used when s3.authType is set to "aws-irsa"</td>
        </tr>
        <tr>
            <td>s3.bucket</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"my-bucket"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>s3.enabled</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>s3.endpoint</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"fra1.digitaloceanspaces.com"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>s3.keySecret</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"my-secret"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>s3.port</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `nil`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>s3.secretAttributeNames.accesskey</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"accesskey"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>s3.secretAttributeNames.secretkey</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"secretkey"`
</pre></td>
            <td></td>
        </tr>
        <tr>
            <td>s3.urlTemplate</td>
            <td>string</td>
            <td class="default-column"></td>
            <td>Go Template that generates the path used to store raw result file and findings.json file in the s3 bucket. Can be used to store the files in a subfolder of the s3 bucket</td>
        </tr>
        <tr>
            <td>securityContext</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":true,"runAsNonRoot":true}`
</pre></td>
            <td>Sets the securityContext on the operators container level. See: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-pod</td>
        </tr>
        <tr>
            <td>securityContext.allowPrivilegeEscalation</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Ensure that users privileges cannot be escalated</td>
        </tr>
        <tr>
            <td>securityContext.capabilities.drop[0]</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"all"`
</pre></td>
            <td>This drops all linux privileges from the operator container. They are not required</td>
        </tr>
        <tr>
            <td>securityContext.privileged</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `false`
</pre></td>
            <td>Ensures that the operator container is not run in privileged mode</td>
        </tr>
        <tr>
            <td>securityContext.readOnlyRootFilesystem</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>Prevents write access to the containers file system</td>
        </tr>
        <tr>
            <td>securityContext.runAsNonRoot</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>Enforces that the Operator image is run as a non root user</td>
        </tr>
        <tr>
            <td>serviceAccount.annotations</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Annotations of the serviceAccount the operator uses to talk to the k8s api</td>
        </tr>
        <tr>
            <td>serviceAccount.labels</td>
            <td>object</td>
            <td class="default-column">
<pre lang="yaml">

    `{}`
</pre></td>
            <td>Labels of the serviceAccount the operator uses to talk to the k8s api</td>
        </tr>
        <tr>
            <td>serviceAccount.name</td>
            <td>string</td>
            <td class="default-column">
<pre lang="yaml">

    `"securecodebox-operator"`
</pre></td>
            <td>Name of the serviceAccount the operator uses to talk to the k8s api</td>
        </tr>
        <tr>
            <td>telemetryEnabled</td>
            <td>bool</td>
            <td class="default-column">
<pre lang="yaml">

    `true`
</pre></td>
            <td>The Operator sends anonymous telemetry data, to give the team an overview how much the secureCodeBox is used. Find out more at https://www.securecodebox.io/telemetry</td>
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

