---
title: "kubeaudit"
category: "scanner"
type: "Kubernetes"
state: "roadmap"
appVersion: "0.9.0"
usecase: "Audit your Kubernetes clusters"
---

![Version: latest](https://img.shields.io/badge/Version-latest-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: v0.11.5](https://img.shields.io/badge/AppVersion-v0.11.5-informational?style=flat-square)

A Helm chart for the kubeaudit security scanner that integrates with the secureCodeBox.

**Homepage:** <https://www.securecodebox.io/scanners/kubeaudit>

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| iteratec GmbH | secureCodeBox@iteratec.com |  |

## Source Code

* <https://github.com/secureCodeBox/secureCodeBox>

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| kubeauditScope | string | `"namespace"` | Automatically sets up rbac roles for kubeaudit to access the ressources it scans. Can be either "cluster" (ClusterRole) or "namespace" (Role)         |
| parserImage.repository | string | `"docker.io/securecodebox/parser-kubeaudit"` | Parser image repository |
| parserImage.tag | string | defaults to the charts version | Parser image tag |
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
| scannerJob.ttlSecondsAfterFinished | string | `nil` | Defines how long the scanner job after finishing will be available (see: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/) |
