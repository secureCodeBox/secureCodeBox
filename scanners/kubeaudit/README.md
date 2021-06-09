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
| kubeauditScope | string | `"namespace"` | Automatically sets up rbac roles for kubeaudit to access the resources it scans. Can be either "cluster" (ClusterRole) or "namespace" (Role) |
| parser.image.repository | string | `"docker.io/securecodebox/parser-kubeaudit"` | Parser image repository |
| parser.image.tag | string | defaults to the charts version | Parser image tag |
| parser.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| scanner.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scanner.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scanner.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scanner.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":true,"runAsNonRoot":true}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.securityContext.allowPrivilegeEscalation | bool | `false` | Ensure that users privileges cannot be escalated |
| scanner.securityContext.capabilities.drop[0] | string | `"all"` | This drops all linux privileges from the container. |
| scanner.securityContext.privileged | bool | `false` | Ensures that the scanner container is not run in privileged mode |
| scanner.securityContext.readOnlyRootFilesystem | bool | `true` | Prevents write access to the containers file system |
| scanner.securityContext.runAsNonRoot | bool | `true` | Enforces that the scanner image is run as a non root user |
| scanner.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |

[kubeaudit GitHub]: https://github.com/Shopify/kubeaudit/
