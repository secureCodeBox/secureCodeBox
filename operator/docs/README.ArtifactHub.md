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

### Quickstart with secureCodeBox on kubernetes

You can find resources to help you get started on our [documentation website](https://www.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://www.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://www.securecodebox.io/docs/getting-started/first-scans) with it.

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

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| customCACertificate | object | `{"certificate":"public.crt","existingCertificate":null}` | Setup for Custom CA certificates. These are automatically mounted into every secureCodeBox component (lurker, parser & hooks). Requires that every namespace has a configmap with the CA certificate(s) |
| customCACertificate.certificate | string | `"public.crt"` | key in the configmap holding the certificate(s) |
| customCACertificate.existingCertificate | string | `nil` | name of the configMap holding the ca certificate(s), needs to be the same across all namespaces |
| image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| image.repository | string | `"docker.io/securecodebox/operator"` | The operator image repository |
| image.tag | string | defaults to the charts version | Parser image tag |
| imagePullSecrets | list | `[]` | Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/) |
| lurker.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| lurker.image.repository | string | `"docker.io/securecodebox/lurker"` | The operator image repository |
| lurker.image.tag | string | defaults to the charts version | Parser image tag |
| minio | object | `{"defaultBuckets":"securecodebox","enabled":true,"resources":{"requests":{"memory":"256Mi"}},"tls":{"enabled":false}}` | Minio default config. More config options an info: https://github.com/minio/minio/blob/master/helm/minio/values.yaml |
| minio.enabled | bool | `true` | Enable this to use minio as storage backend instead of a cloud bucket provider like AWS S3, Google Cloud Storage, DigitalOcean Spaces etc. |
| podSecurityContext | object | `{}` | Sets the securityContext on the operators pod level. See: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-container |
| resources | object | `{"limits":{"cpu":"100m","memory":"30Mi"},"requests":{"cpu":"100m","memory":"20Mi"}}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| s3.authType | string | `"access-secret-key"` | Authentication method. Supports access-secret-key (used by most s3 endpoint) and aws-irsa (Used by AWS EKS IAM Role to Kubenetes Service Account Binding. Support for AWS IRSA is considered experimental in the secureCodeBox) |
| s3.awsStsEndpoint | string | `"https://sts.amazonaws.com"` | STS Endpoint used in AWS IRSA Authentication. Change this to the sts endpoint of your aws region. Only used when s3.authType is set to "aws-irsa" |
| s3.bucket | string | `"my-bucket"` |  |
| s3.enabled | bool | `false` |  |
| s3.endpoint | string | `"fra1.digitaloceanspaces.com"` |  |
| s3.keySecret | string | `"my-secret"` |  |
| s3.port | string | `nil` |  |
| s3.secretAttributeNames.accesskey | string | `"accesskey"` |  |
| s3.secretAttributeNames.secretkey | string | `"secretkey"` |  |
| s3UrlTemplate | string | `nil` |  |
| securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":true,"runAsNonRoot":true}` | Sets the securityContext on the operators container level. See: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-pod |
| securityContext.allowPrivilegeEscalation | bool | `false` | Ensure that users privileges cannot be escalated |
| securityContext.capabilities.drop[0] | string | `"all"` | This drops all linux privileges from the operator container. They are not required |
| securityContext.privileged | bool | `false` | Ensures that the operator container is not run in privileged mode |
| securityContext.readOnlyRootFilesystem | bool | `true` | Prevents write access to the containers file system |
| securityContext.runAsNonRoot | bool | `true` | Enforces that the Operator image is run as a non root user |
| serviceAccount.annotations | object | `{}` | Annotations of the serviceAccount the operator uses to talk to the k8s api |
| serviceAccount.labels | object | `{}` | Labels of the serviceAccount the operator uses to talk to the k8s api |
| serviceAccount.name | string | `"securecodebox-operator"` | Name of the serviceAccount the operator uses to talk to the k8s api |
| telemetryEnabled | bool | `true` | The Operator sends anonymous telemetry data, to give the team an overview how much the secureCodeBox is used. Find out more at https://www.securecodebox.io/telemetry |

## Contributing

Contributions are welcome and extremely helpful 🙌
Please have a look at [Contributing](./CONTRIBUTING.md)

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [Slack][scb-slack]
- [Twitter][scb-twitter]

secureCodeBox is an official [OWASP][scb-owasp] project.

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

