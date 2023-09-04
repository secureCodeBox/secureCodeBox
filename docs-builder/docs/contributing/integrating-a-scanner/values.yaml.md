---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: values.yaml
sidebar_position: 2
---

The `values.yaml` is also created by `helm create new-scanner`.
Most of these generated fields are not necessary for the _secureCodeBox_.
In the following we will describe the important fields.
The final `values.yaml` will look something like this:

```yaml
# Define the image and settings for the parser container
parser:
  image:
    # parser.image.repository -- Parser image repository
    repository: docker.io/securecodebox/parser-nmap
    # parser.image.tag -- Parser image tag
    # @default -- defaults to the charts version
    tag: null

  # parser.ttlSecondsAfterFinished -- seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/
  ttlSecondsAfterFinished: null
  # @default -- 3
  backoffLimit: 3
  # parser.env -- Optional environment variables mapped into each parseJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)
  env: []

  # parser.scopeLimiterAliases -- Optional finding aliases to be used in the scopeLimiter.
  scopeLimiterAliases: {}

# Do the same for the scanner containers
scanner:
  image:
    # scanner.image.repository -- Container Image to run the scan
    repository: docker.io/securecodebox/parser-nmap
    # scanner.image.tag -- defaults to the charts appVersion
    tag: null

  # scanner.ttlSecondsAfterFinished -- seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/
  ttlSecondsAfterFinished: null
  # scannerJob.backoffLimit -- There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy)
  # @default -- 3
  backoffLimit: 3

  # scanner.resources -- CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/)
  resources: {}
  #   resources:
  #     requests:
  #       memory: "256Mi"
  #       cpu: "250m"
  #     limits:
  #       memory: "512Mi"
  #       cpu: "500m"

  # scanner.env -- Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)
  env: []

  # scanner.extraVolumes -- Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/)
  extraVolumes: []

  # scanner.extraVolumeMounts -- Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/)
  extraVolumeMounts: []

  # scanner.extraContainers -- Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
  extraContainers: []

  # scanner.securityContext -- Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)
  securityContext:
    runAsNonRoot: true
    readOnlyRootFilesystem: true
    allowPrivilegeEscalation: false
    privileged: false
    capabilities:
      drop:
        - all
```

## scanner and parser

The two top-level fields `scanner` and `parser` define the containers and settings for the scanner and parser, respectively.
All fields below are common for both scanner and parser.

### image

The `image` field contains the container image and tag used for the scanner or parser.
For the scanner, this could be the official image of the scanner or a custom image, if one is needed.
Usually the `tag` of the image is `null` and will default to the charts `appVersion` (for the scanner) or `version` (for the parser).
See below how to use a local docker image.
For WPScan the official image can be used so the `image` fields for scanner and parser may look like this:

```yaml
scanner:
  image:
    repository: wpscanteam/wpscan
    tag: null
  # ...

parser:
  image:
    repository: docker.io/securecodebox/parser-wpscan
    tag: null
  # ...
```

### ttlSecondsAfterFinished

Defines how long the scanner job after finishing will be available (see: [TTL Controller for Finished Resources | Kubernetes](https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/)).

### resources

The `resources` field can limit or request resources for the scan / parse job (see: [Managing Resources For Containers | Kubernetes](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)).
A basic example could be the following:

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### env

Optional environment variables mapped into the job (see: [Define Environment Variables for a Container | Kubernetes](https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)).

### extraVolumes

Optional Volumes mapped into the job (see: [Volumes | Kubernetes](https://kubernetes.io/docs/concepts/storage/volumes/)).

### extraVolumeMounts

Optional VolumeMounts mapped into the job (see: [Volumes | Kubernetes](https://kubernetes.io/docs/concepts/storage/volumes/)).

### extraContainers

Optional additional Containers started with the job (see: [Init Containers | Kubernetes](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)).

### securityContext

Optional securityContext set on the container (see: [Configure a Security Context for a Pod or Container | Kubernetes](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)).

### scopeLimiterAliases

Optional scopeLimiterAliases set on the parse definition (see [ScopeLimiterAliases](/docs/api/crds/parse-definition#scopelimiteraliases-optional))

### affinity

Optional affinity settings that control how the job is scheduled (see: [Node Affinity | Kubernetes](https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/))

### tolerations

Optional tolerations settings that control how the job is scheduled (see: [Tolerations | Kubernetes](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/))