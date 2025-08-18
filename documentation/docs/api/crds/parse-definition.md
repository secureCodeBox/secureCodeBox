---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "ParseDefinition"
sidebar_position: 5
---

ParseDefinitions are Custom Resource Definitions (CRDs) that describe how the secureCodeBox can convert a raw finding report (e.g., XML report from nmap) into the generic [secureCodeBox finding format](/docs/api/finding).

ParseDefinitions are typically packaged together with a [ScanType](/docs/api/crds/scan-type/).
A ScanType references the **name** of a ParseDefinition via the [extractResults.type field](/docs/api/crds/scan-type#extractresultstype-required).

## Specification (Spec)

### Image (Required)

`image` is the reference to the parser container image that can transform the raw scan report into findings.

To learn how to write parsers and package them into images, see the [documentation on integrating new scanners](/docs/contributing/integrating-a-scanner).

### ImagePullSecrets (Optional)

`imagePullSecrets` can be used to access private parser images.
This uses the standard Kubernetes [imagePullSecrets structure](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/).

### ImagePullPolicy (Optional)

`imagePullPolicy` defines when the container image should be pulled. Valid values are:

- `Always`: Always pull the image
- `IfNotPresent` (default): Pull the image only if not present locally  
- `Never`: Never pull the image

Defaults to `Always` if the `:latest` tag is specified, otherwise `IfNotPresent`.

### ContentType (Optional)

`contentType` specifies the format of the scan result file. Valid values are:

- `Text` (default): The scan result is a text file
- `Binary`: The scan result is a binary file

This helps the parser understand how to process the input data.

### TTLSecondsAfterFinished (Optional)

`ttlSecondsAfterFinished` can be used to automatically delete the completed Kubernetes Job used to run the parser.
This sets the `ttlSecondsAfterFinished` field on the created Job. This requires your cluster to have the [TTLAfterFinished](https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/) feature gate enabled.

### ScopeLimiterAliases (Optional)

`scopeLimiterAliases` can be used in combination with `scopeLimiter` to create aliases for fields in findings.
This ensures that the `scopeSelector` can always select an alias, regardless of the underlying data representation in a finding.
This field supports Mustache templating and has access to the finding object.

### Env (Optional)

`env` allows you to specify environment variables for the parser container.
This uses the same API as the `env` property on Kubernetes Pods.

See the [Kubernetes documentation](https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) for more details.

### Volumes and VolumeMounts (Optional)

`volumes` and `volumeMounts` allow you to specify volumes and their mount points for the parser container.
This can be useful for providing additional data or configuration files to the parser.

These use the same API as the `volumes` and `volumeMounts` properties on Kubernetes Pods.

See the [Kubernetes documentation](https://kubernetes.io/docs/tasks/configure-pod-container/configure-volume-storage/) for more details.

### NodeSelector (Optional)

`nodeSelector` allows you to specify simple node selection constraints to control which nodes the parser runs on.

See the [Kubernetes documentation](https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes/) for more details.

See the [Scope HowTo](/docs/how-tos/scope) for more information.

### Affinity and Tolerations (optional)

[`affinity`](https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) and [`tolerations`](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) can be used to control which nodes the parser is executed on with more advanced rules than nodeSelector.
These values are typically set via Helm values during installation.

### Resources (Optional)

`resources` lets you override the resource limits and requests for the parser container. See the [Kubernetes documentation](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) for more details.

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

The ParseDefinition status is currently empty and managed entirely by Kubernetes. Future versions may include additional status information.

## Example

```yaml
apiVersion: execution.securecodebox.io/v1
kind: ParseDefinition
metadata:
  name: nmap-xml
spec:
  image: docker.io/securecodebox/parser-nmap:latest
  imagePullPolicy: IfNotPresent
  contentType: Text
  env:
    - name: DEBUG
      value: "false"
  imagePullSecrets:
    - name: private-registry-secret
  nodeSelector:
    kubernetes.io/arch: amd64
  resources:
    requests:
      cpu: 200m
      memory: 100Mi
    limits:
      cpu: 400m
      memory: 200Mi
  scopeLimiterAliases:
    ip: "{{attributes.ip_address}}"
    hostname: "{{attributes.hostname}}"
  ttlSecondsAfterFinished: 300
  tolerations:
    - key: "parser-only"
      operator: "Equal"
      value: "true"
      effect: "NoSchedule"
```

When integrating a new scanner, the ParseDefinition follows specific conventions used in the secureCodeBox repository.
More information can be found in the [templates folder documentation for integrating new scanners](/docs/contributing/integrating-a-scanner/templates-dir).
