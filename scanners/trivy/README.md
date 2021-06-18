---
title: "Trivy"
category: "scanner"
type: "Container"
state: "released"
appVersion: "0.18.3"
usecase: "Container Vulnerability Scanner"
---

`Trivy` (`tri` pronounced like **tri**gger, `vy` pronounced like en**vy**) is a simple and comprehensive vulnerability scanner for containers and other artifacts.
A software vulnerability is a glitch, flaw, or weakness present in the software or in an Operating System.
`Trivy` detects vulnerabilities of OS packages (Alpine, RHEL, CentOS, etc.) and application dependencies (Bundler, Composer, npm, yarn, etc.).
`Trivy` is easy to use. Just install the binary, and you're ready to scan. All you need to do for scanning is to specify a target such as an image name of the container.

To learn more about the Trivy scanner itself visit on [Trivy's GitHub Repository](https://github.com/aquasecurity/trivy).

<!-- end -->

## Deployment

The Trivy scanType can be deployed via helm:

```bash
helm upgrade --install trivy secureCodeBox/trivy
```

## Scanner Configuration

The following security scan configuration example are based on the [Trivy Documentation], please take a look at the original documentation for more configuration examples.

- Filter the vulnerabilities by severities `trivy image --severity HIGH,CRITICAL ruby:2.4.0`
- Filter the vulnerabilities by type (`os` or `library`) `trivy image --vuln-type os ruby:2.4.0`
- Skip update of vulnerability DB: `trivy image --skip-update python:3.4-alpine3.9`
- Ignore unfixed vulnerabilities:`trivy image --ignore-unfixed ruby:2.4.0` By default, Trivy also detects unpatched/unfixed vulnerabilities. This means you can't fix these vulnerabilities even if you update all packages. If you would like to ignore them, use the `--ignore-unfixed` option.

## Chart Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| parser.image.repository | string | `"docker.io/securecodebox/parser-trivy"` | Parser image repository |
| parser.image.tag | string | defaults to the charts version | Parser image tag |
| parser.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| scanner.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scanner.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scanner.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scanner.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.image.repository | string | `"docker.io/aquasec/trivy"` | Container Image to run the scan |
| scanner.image.tag | string | `nil` | defaults to the charts appVersion |
| scanner.nameAppend | string | `nil` | append a string to the default scantype name. |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.securityContext | object | `{}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
