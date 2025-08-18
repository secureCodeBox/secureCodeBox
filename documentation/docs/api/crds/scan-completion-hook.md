---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "ScanCompletionHook"
sidebar_position: 6
---

ScanCompletionHooks are Custom Resource Definitions (CRDs) used to define custom behavior that should be run after a scan has been completed.

For more detailed explanations on how a new hook can be integrated, see the [hooks section](/docs/contributing/integrating-a-hook) in the contribution part of our docs.

## Specification (Spec)

### Type (Required)

The `type` field can be either `ReadOnly` or `ReadAndWrite`.

`ReadOnly` hooks only have read access to the findings and raw scan reports (e.g., XML output from nmap). These are typically used to export findings to external systems like "Elasticsearch" or "DefectDojo" or to send notifications to chat systems like "Slack". ReadOnly hooks are executed in parallel to speed up their runtime.

`ReadAndWrite` hooks can update both findings and raw scan reports. This can be used to attach additional metadata to findings by comparing them against external inventory systems or cloud provider APIs.

### Priority (Optional)

The `priority` field helps determine the execution order of the hook.
Hooks with a higher priority will be scheduled before hooks with a lower priority.
By default, hooks are given a priority of 0.
Hooks with equal priority are scheduled according to the default schedule:

1. Run ReadAndWrite hooks one by one (undefined order).
2. Once all ReadAndWrite hooks are completed, ReadOnly hooks are scheduled in parallel.

The following diagram shows an example run:

```text
                                 Priority 2                                          Priority 1                    Priority 0
    +-------------------------------------------------------------------+     +----------------------+      +----------------------+
    |    +--------------+       +--------------+       +--------------+ |     |    +--------------+  |      |    +--------------+  |
    | -> | ReadAndWrite |------>| ReadAndWrite |------>|   ReadOnly   | |     | -> |   ReadOnly   |  | ---> | -> | ReadAndWrite |  |
    |    +--------------+       +--------------+  |    +--------------+ |     |    +--------------+  |      |    +--------------+  |
--> |                                             |                     | --> |                      |      +----------------------+
    |                                             |    +--------------+ |     |    +--------------+  |
    |                                             +--->|   ReadOnly   | |     | -> |   ReadOnly   |  |
    |                                                  +--------------+ |     |    +--------------+  |
    +-------------------------------------------------------------------+     +----------------------+
```

### Image (Required)

The `image` field contains a container image reference for the image that should run as the hook.

### ImagePullSecrets (Optional)

The `imagePullSecrets` field can be used to specify pull secrets for accessing the hook's image from a private registry.

### ImagePullPolicy (Optional)

The `imagePullPolicy` field specifies when the image should be pulled from the registry.
Valid values are `Always`, `Never`, or `IfNotPresent`. Defaults to `Always` if the `:latest` tag is specified, otherwise `IfNotPresent`.
See the [Kubernetes docs](https://kubernetes.io/docs/concepts/containers/images#updating-images) for more information.

### Env (Optional)

The `env` field can be used to specify environment variables and mount secrets into containers.

### Volumes (Optional)

`volumes` lets you specify Kubernetes volumes to make available to the hook.
Similar to `env`, it can be used to pass data into a container.
It must be combined with [`volumeMounts`](#volumemounts-optional) to be useful (see below).

### VolumeMounts (Optional)

`volumeMounts` lets you specify where previously-created volumes should be mounted inside the container.
It uses the same API as the `volumeMounts` property on Kubernetes Pods.

### Affinity and Tolerations (optional)

### NodeSelector (Optional)

[`nodeSelector`](https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes/) allows you to specify simple node selection constraints to control which nodes the hook runs on.

### Affinity and Tolerations (Optional)

[`affinity`](https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) and [`tolerations`](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) can be used to control which nodes the hook is executed on with more advanced rules than nodeSelector.
These values are typically set via Helm values during installation.

### ServiceAccountName (Optional)

The `serviceAccountName` field can be used to specify a custom ServiceAccount for the Kubernetes Job running the hook.
This should only be used if your hook needs specific RBAC access. Otherwise, the hook runs using a `scan-completion-hook` service account.

The service account should have at least `get` permissions on `scans.execution.securecodebox.io`, and `get` & `patch` permissions on `scans.execution.securecodebox.io/status` for hooks to work correctly.

### TTLSecondsAfterFinished (Optional)

`ttlSecondsAfterFinished` can be used to automatically delete the completed Kubernetes Job used to run the hook.
This sets the `ttlSecondsAfterFinished` field on the created Job. This requires your cluster to have the [TTLAfterFinished](https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/) feature gate enabled.

### Resources (Optional)

`resources` lets you override the resource limits and requests for the hook container. See the [Kubernetes documentation](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) for more details.

```yaml
resources:
  requests:
    cpu: 42mi
    memory: 256Mi
  limits:
    cpu: 4
    memory: 4Gi
```

If no resources are set the following defaults are applied:

```yaml
resources:
  requests:
    cpu: 200m
    memory: 100Mi
  limits:
    cpu: 400m
    memory: 200Mi
```

When you only want to set either requests or limits, you will have to set the other one explicitly to null to avoid the defaulting applied via the Kubernetes API, e.g. to disable the resource limits:

```yaml
resources:
  requests:
    cpu: 200m
    memory: 100Mi
  limits: null
```

## Status

The ScanCompletionHook status is currently empty and managed entirely by Kubernetes. Future versions may include additional status information.

## Example

```yaml
apiVersion: execution.securecodebox.io/v1
kind: ScanCompletionHook
metadata:
  name: elastic-persistence-hook
spec:
  type: ReadOnly
  priority: 2
  image: docker.io/securecodebox/persistence-elastic:latest
  imagePullPolicy: IfNotPresent
  imagePullSecrets:
    - name: image-pull-secret
  nodeSelector:
    kubernetes.io/arch: amd64
  serviceAccountName: elastic-persistence
  env:
    - name: ELASTICSEARCH_ADDRESS
      value: https://data.chase.securecodebox.io
    - name: ELASTICSEARCH_USERNAME
      valueFrom:
        secretKeyRef:
          key: username
          name: elastic-persistence-credentials
    - name: ELASTICSEARCH_PASSWORD
      valueFrom:
        secretKeyRef:
          key: password
          name: elastic-persistence-credentials
  volumes:
    - name: config
      configMap:
        name: elastic-config
  volumeMounts:
    - name: config
      mountPath: /etc/elastic
  ttlSecondsAfterFinished: 60
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 400m
      memory: 512Mi
```
