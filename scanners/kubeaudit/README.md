<!--
SPDX-FileCopyrightText: 2020 iteratec GmbH

SPDX-License-Identifier: Apache-2.0
-->

---
title: "kubeaudit"
category: "scanner"
type: "Kubernetes"
state: "released"
appVersion: "0.15.1"
usecase: "Kubernetes Configuration Scanner"
---

Kubeaudit finds security misconfigurations in you Kubernetes Resources and gives tips on how to resolve these.

Kubeaudit comes with a large lists of "auditors" which test various aspects, like the SecurityContext of pods.
You can find the complete list of [auditors here](https://github.com/Shopify/kubeaudit/tree/master/docs/auditors).

To learn more about the kubeaudit itself visit [kubeaudit GitHub].

<!-- end -->

## Deployment

The kube-hunter ScanType can be deployed via helm:

```bash
helm upgrade --install kubeaudit secureCodeBox/kubeaudit
```

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| kubeauditScope | string | `"namespace"` | Automatically sets up rbac roles for kubeaudit to access the ressources it scans. Can be either "cluster" (ClusterRole) or "namespace" (Role)         |
| parseJob.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| parserImage.repository | string | `"docker.io/securecodebox/parser-kubeaudit"` | Parser image repository |
| parserImage.tag | string | defaults to the charts version | Parser image tag |
| scannerJob.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scannerJob.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scannerJob.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scannerJob.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scannerJob.securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":true,"runAsNonRoot":true}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scannerJob.securityContext.allowPrivilegeEscalation | bool | `false` | Ensure that users privileges cannot be escalated |
| scannerJob.securityContext.capabilities.drop[0] | string | `"all"` | This drops all linux privileges from the container. |
| scannerJob.securityContext.privileged | bool | `false` | Ensures that the scanner container is not run in privileged mode |
| scannerJob.securityContext.readOnlyRootFilesystem | bool | `true` | Prevents write access to the containers file system |
| scannerJob.securityContext.runAsNonRoot | bool | `true` | Enforces that the scanner image is run as a non root user |
| scannerJob.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |

[kubeaudit GitHub]: https://github.com/Shopify/kubeaudit/
