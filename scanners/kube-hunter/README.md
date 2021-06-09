---
title: "kube-hunter"
category: "scanner"
type: "Kubernetes"
state: "released"
appVersion: "0.3.1"
usecase: "Kubernetes Vulnerability Scanner"
---

kube-hunter hunts for security weaknesses in Kubernetes clusters. The tool was developed to increase awareness and visibility for security issues in Kubernetes environments. You should NOT run kube-hunter on a Kubernetes cluster that you don't own!

To learn more about the kube-hunter scanner itself visit [kube-hunter GitHub] or [kube-hunter Website].

<!-- end -->

## Deployment

The kube-hunter ScanType can be deployed via helm:

```bash
helm upgrade --install kube-hunter secureCodeBox/kube-hunter
```

## Scanner Configuration

The following security scan configuration example are based on the [kube-hunter Documentation], please take a look at the original documentation for more configuration examples.

* To specify remote machines for hunting, select option 1 or use the --remote option. Example: `kube-hunter --remote some.node.com`
* To specify interface scanning, you can use the --interface option (this will scan all the machine's network interfaces). Example: `kube-hunter --interface`
* To specify a specific CIDR to scan, use the --cidr option. Example: `kube-hunter --cidr 192.168.0.0/24`

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascadingRules.enabled | bool | `true` | Enables or disables the installation of the default cascading rules for this scanner |
| parser.image.repository | string | `"docker.io/securecodebox/parser-kube-hunter"` | Parser image repository |
| parser.image.tag | string | defaults to the charts version | Parser image tag |
| parser.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| scanner.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scanner.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scanner.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scanner.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.image.repository | string | `"docker.io/securecodebox/scanner-kube-hunter"` | Container Image to run the scan |
| scanner.image.tag | string | `nil` | defaults to the charts version |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.securityContext | object | `{}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |

[kube-hunter Website]: https://kube-hunter.aquasec.com/
[kube-hunter GitHub]: https://github.com/aquasecurity/kube-hunter
[kube-hunter Documentation]: https://github.com/aquasecurity/kube-hunter#scanning-options
