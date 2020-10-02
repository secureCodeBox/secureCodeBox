# test-scan

![Version: latest](https://img.shields.io/badge/Version-latest-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square)

A Helm chart to test the secureCodeBox operator

## Maintainers

| Name | Email | Url |
| ---- | ------ | --- |
| iteratec GmbH | security@iteratec.com |  |

## Source Code

* <https://github.com/secureCodeBox/secureCodeBox>

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| image.repository | string | `"docker.io/securecodebox/scanner-test-scan"` |  |
| image.tag | string | `nil` |  |
| parserImage.repository | string | `"docker.io/securecodebox/parser-test-scan"` | Parser image repository |
| parserImage.tag | string | defaults to the charts version | Parser image tag |
| scannerJob.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scannerJob.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scannerJob.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scannerJob.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scannerJob.ttlSecondsAfterFinished | string | `nil` | Defines how long the scanner job after finishing will be available (see: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/) |
