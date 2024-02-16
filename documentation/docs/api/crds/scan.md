---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Scan"
sidebar_position: 2
---

The Scan Custom Resource Definition (CRD) lets you define how a specific scan should be configured.
The secureCodeBox Operator will then use this specification to execute the scan.

## Specification (Spec)

### ScanType (Required)

The `scanType` references the **name** of a [ScanType Custom Resource](/docs/api/crds/scan-type/).

### Parameters (Required)

`parameters` is a string array of command line flags which are passed to the scanner.

These usually contain scanner specific configurations and target specification.

### Env (Optional)

`env` lets you pass in custom environment variables to the scan container.
This can be useful to pass in secret values like login credentials scanner require without having to define them in plain text.

Env has the same API as "env" property on Kubernetes Pods.

See:

- [Documentation](https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)
- [API Reference](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.18/#envvar-v1-core)

### Volumes (Optional)

`volumes` lets you specify Kubernetes volumes that you want to use and make available to the scan container.
Similarly to `env`, it can be used to pass data into a container.
It has to be combined with [`volumeMounts`](#volumemounts-optional) to be useful (see below).
It can also be used in combination with `initContainers` to provision files, VCS repositories, or other content into a scanner - see [`initContainers`](#initcontainers-optional) for an example.

`volumes` has the same API as the `volumes` property on Kubernetes pods.

See:

- [Documentation](https://kubernetes.io/docs/tasks/configure-pod-container/configure-volume-storage/)
- [API Reference](https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#volumes-1)

### VolumeMounts (Optional)

`volumeMounts` let you specify where you want the previously-created volumes to be mounted inside the container.
It is used in combination with [`volumes`](#volumes-optional) (see above).

`volumeMounts` has the same API as the `volumeMounts` property on Kubernetes pods.

See:

- [Documentation](https://kubernetes.io/docs/tasks/configure-pod-container/configure-volume-storage/)
- [API Reference](https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#volumes-1)

### InitContainers (Optional)

`initContainers` lets you specify a (set of) container(s) that are run before the scan itself.
You can specify arbitrary containers with any command that you desire.
By default, init containers do not share a file system with the scan job.
If you want to use init containers to provision files or directories for the scan job, you need to explicitly create a volume and mount it to both the init container and the scan job itself (using the [`volumeMounts`](#volumemounts-optional) discussed above).
For example, if you want to download a file that contains a list of scan targets for nmap, you could configure the scan like this:

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "nmap-from-web"
spec:
  # Specify a volume that will be used to share files between the containers
  volumes:
    - name: target-list
      emptyDir: {}
  # Mount the volume to the scanner at the path /targets
  volumeMounts:
    - mountPath: "/targets/"
      name: target-list
  # Declare the initContainers
  initContainers:
    # For this, we use only a single init container - you can specify multiple, and they will be executed sequentially
    - name: "download-targets"
      # Use the "busybox" image, which contains wget
      image: busybox
      # Launch wget to download a list of targets and place it in /targets/targets.txt
      command:
        - wget
        - "https://my.website.tld/targets.txt"
        - "-O"
        - /targets/targets.txt
      # Make the volume used above available to the initContainer as well, at the same path
      volumeMounts:
        - mountPath: "/targets/"
          name: target-list
  # Declare the actual scan you want to perform, using the downloaded file
  scanType: "nmap"
  parameters:
    - "-iL"
    - "/targets/targets.txt"
```

`initContainers` has the same API as the `initContainers` property on Kubernetes pods, which is a list of `container`s.

See:

- [Documentation](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
- [API Reference](https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#containers)

### Affinity and Tolerations (optional)

[`affinity`](https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) and [`tolerations`](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) can be used to control which nodes the parser is executed on.

### Cascades (Optional)

`cascades` let you start new scans based on the results of the current scan.

The cascades config in the scans spec contains [Kubernetes Label Selectors](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19/#labelselector-v1-meta) which allow you to select which [CascadingRule](https://www.securecodebox.io/docs/api/crds/cascading-rule) are allowed to be used by the cascading logic.

Furthermore, in the cascade config you can specify whether cascading scan should inherit parent fields:

- `inheritLabels`: `true`
- `inheritAnnotations`: `true`
- `inheritEnv`: `false`
- `inheritVolumes`: `false`
- `inheritInitContainers`: `false`
- `inheritHookSelector`: `false`
- `inheritAffinity`: `true`
- `inheritTolerations`: `true`

These fields will merge the parent's entries with entries defined in the cascading rules.
Entries defined in cascading rules will only apply to the current scan.
There are two exceptions to this rule: in the case of Affinity and Tolerations, entries will be replaced instead of merged, and will be used for all following scans.

:::caution
Defining identical entries in both the Scan AND the Cascading Rule resource will lead to undefined behaviour.
See [#789](https://github.com/secureCodeBox/secureCodeBox/issues/789) for more details.
:::

To use cascades you'll need to have the [CascadingScan hook](https://www.securecodebox.io/docs/hooks/cascading-scans) installed.
For an example on how they can be used see the [Scanning Networks HowTo](https://www.securecodebox.io/docs/how-tos/scanning-networks)

#### ScopeLimiter (Optional)

`scopeLimiter` allows you to define certain rules to which cascading scans must comply before they may cascade.
For example, you can define that you can only trigger a follow-up scan against a host if its IP address is within your predefined IP range.
You can use Mustache templating in order to select certain properties from findings.

Under `scopeLimiter`, you may specify `anyOf`, `noneOf`, and `allOf` with a selector to limit your scope.
If you specify multiple fields, all the rules must pass.

A selector looks similar to the [Kubernetes Label Selectors](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19/#labelselector-v1-meta).

```yaml
anyOf:
  - key: "scope.cascading.securecodebox.io/cidr"
    operator: "InCIDR"
    values: ["{{attributes.ip}}"]
```

The `key` references one of the annotations defined on your scan.
The annotation name _must_ start with `scope.cascading.securecodebox.io/`.
These annotations can only be added on the initial scan (i.e., they cannot be modified using the [`scanAnnotations`](/docs/api/crds/cascading-rule#scanlabels--scanannotations-optional) field of the cascading scan rules) and are inherited by default.

`operator` is one of `In`, `NotIn`, `Contains`, `DoesNotContain`, `InCIDR`, `NotInCIDR`, `SubdomainOf`, `NotSubdomainOf`.

`values` is a list of values for which the selector should pass.

##### Selecting lists

A custom rendering function has been provided to select attributes in findings that are in a list. An example finding:

```json title="Finding"
{
  name: "Subdomains found",
  category: "Subdomain"
  attributes: {
    domains: ["example.com", "subdomain.example.com"],
  }
}
```

To select the domains data in this finding, use the `asList` notation as shown below.

```yaml
annotations:
  scope.cascading.securecodebox.io/domain: "example.com"
---
key: "scope.cascading.securecodebox.io/domain"
operator: "In"
values: ["{{#asList}}{{attributes.domains}}{{/asList}}"]
```

The values will render to: `["example.com", "subdomain.example.com"]`.

Some findings have data in lists of objects, such as the following:

```json title="Finding"
{
  name: "Subdomains found",
  category: "Subdomain"
  attributes: {
    addresses: [
      {
        domain: "example.com",
        ip: "127.0.0.1",
      },
      {
        domain: "subdomain.example.com",
        ip: "127.0.0.2",
      }
    ]
  }
}
```

To select the domains data in this finding, use the `getValues` notation as shown below.

```yaml
annotations:
  scope.cascading.securecodebox.io/domain: "example.com"
---
key: "scope.cascading.securecodebox.io/domain"
operator: "In"
# Note that the parameter is *not* set inside curly braces!
values: ["{{#getValues}}attributes.addresses.domain{{/getValues}}"]
```

You can also manually split values from findings if your finding is like so:

```json title="Finding"
{
  name: "Subdomains found",
  category: "Subdomain"
  attributes: {
    domains: "example.com,subdomain.example.com",
  }
}
```

To select the domains data in this finding, use the `split` notation as shown below.

```yaml
annotations:
  scope.cascading.securecodebox.io/domain: "example.com"
---
key: "scope.cascading.securecodebox.io/domain"
operator: "In"
values: ["{{#split}}{{attributes.domains}}{{/split}}"]
```

##### Operators

`In` & `NotIn`: The scope annotation value exists in one of `values`. Matching example:

```yaml
annotations:
  scope.cascading.securecodebox.io/domain: "example.com"
---
key: "scope.cascading.securecodebox.io/domain"
operator: "In"
values: ["example.com", "subdomain.example.com"]
```

`Contains` & `DoesNotContain`: The scope annotation value is considered a comma-seperated list and checks if every `values` is in that list. Matching example:

```yaml
annotations:
  scope.cascading.securecodebox.io/domain: "example.com,subdomain.example.com,other.example.com"
---
key: "scope.cascading.securecodebox.io/domain"
operator: "Contains"
values: ["example.com", "subdomain.example.com"]
```

`InCIDR` & `NotInCIDR`: The scope annotation value is considered a [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) and checks if every `values` is within the subnet of that CIDR. Supports both IPv4 and IPv6. If the scope is defined in IPv4, will only validate IPv4 IPs in the finding values. Vice-versa for IPv6 defined in scope and IPv4 found in values. Note that all IPs in finding values must be valid addresses, regardless of whether IPv4 or IPv6 was used in the scope definition. Matching example:

```yaml
annotations:
  scope.cascading.securecodebox.io/cidr: "10.10.0.0/16"
---
key: "scope.cascading.securecodebox.io/cidr"
operator: "InCIDR"
values: ["10.10.1.2", "10.10.1.3", "2001:0:ce49:7601:e866:efff:62c3:fffe"]
```

`SubdomainOf` & `NotSubdomainOf`: Checks if every `values` is a subdomain of the scope annotation value (inclusive; i.e. example.com is a subdomain of example.com). Matching example:

```yaml
annotations:
  scope.cascading.securecodebox.io/domain: "example.com"
---
key: "scope.cascading.securecodebox.io/domain"
operator: "SubdomainOf"
values: ["subdomain.example.com", "example.com"]
```

See the [Scope HowTo](/docs/how-tos/scope) for more information.

### HookSelector (Optional)

`hookSelector` allows you to select which hooks to run using [Kubernetes Label Selectors](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19/#labelselector-v1-meta).

You can only select hooks in the namespace in which the scan is running.

Leaving this field undefined will select all available hooks in this namespace.

```yaml
hookSelector:
  matchExpressions:
    - key: app.kubernetes.io/instance
      operator: In
      values: ["defectdojo", "cascading-scans"]
```

:::note
Cascading scans are currently implemented as a hook.
To use cascading scans in combination with hookSelector, ensure that you also select the cascading scans hook.
The cascading scan hook, as well as any future core secureCodeBox features implemented as hooks, carry the label `securecodebox.io/internal: true` to make this easier.
:::

For more examples on how this field can be used, see the [Hook HowTo](/docs/how-tos/hooks).

### Resources (Optional)

`resources` lets you overwrite the resource limits and requests for the primary scanner container from the values defined in the [ScanType](./scan-type). See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/

```yaml
resources:
  requests:
    cpu: 42mi
    memory: 256Mi
  limits:
    cpu: 4
    memory: 4Gi
```

## Metadata

Metadata is a standard field on Kubernetes resources. It contains multiple relevant fields, e.g. the name of the resource, its namespace and a `creationTimestamp` of the resource. See more on the [Kubernetes Docs](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/) and the [Kubernetes API Reference](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.21/#objectmeta-v1-meta).

## Status

Defines the observed state of a Scan. This will be filled by Kubernetes.
It contains (see: [Go Type ScanStatus](https://github.com/secureCodeBox/secureCodeBox/blob/main/operator/apis/execution/v1/scan_types.go#L49))

- `State`: State of the scan (See: [secureCodeBox | ScanControler](https://github.com/secureCodeBox/secureCodeBox/blob/main/operator/controllers/execution/scans/scan_controller.go#L105))
- `FinishedAt`: Time when scan, parsers and hooks for this scan are marked as 'Done'
- `ErrorDescription`: Description of an Error (if there is one)
- `RawResultType`: Determines which kind of ParseDefinition will be used to turn the raw results of the scanner into findings
- `RawResultFile`: Filename of the result file of the scanner. e.g. `nmap-result.xml`
- `FindingDownloadLink`: Link to download the finding json file from. Valid for 7 days
- `RawResultDownloadLink`: RawResultDownloadLink link to download the raw result file from. Valid for 7 days
- `Findings`: FindingStats (See [Go Type FindingStats](https://github.com/secureCodeBox/secureCodeBox/blob/main/operator/apis/execution/v1/scan_types.go#L89))
- `ReadAndWriteHookStatus`: Status of the Read and Write Hooks

## Example

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
status: # Set during runtime. Do not edit via values.yaml etc.
metadata:
  name: "nmap-scanme.nmap.org"
  annotations:
    scope.cascading.securecodebox.io/cidr: "10.10.0.0/16"
    scope.cascading.securecodebox.io/domain: "example.com"
spec:
  scanType: "nmap"
  parameters:
    # Use nmap's service detection feature
    - "-sV"
    - scanme.nmap.org
  env:
    - name: TEST_ENV
      valueFrom:
        secretKeyRef:
          key: secret-name
          name: zap-customer-credentials
    - name: GREETING
      value: "Hello from the secureCodeBox :D"
  cascades:
    inheritLabels: false
    inheritAnnotations: true
    matchLabels:
      securecodebox.io/intensive: light
    matchExpression:
      key: "securecodebox.io/invasive"
      operator: In
      values: [non-invasive, invasive]
    scopeLimiter:
      validOnMissingRender: true
      allOf:
        - key: "scope.cascading.securecodebox.io/cidr"
          operator: "InCIDR"
          values: ["{{attributes.ip}}"]
      noneOf:
        - key: "scope.cascading.securecodebox.io/domain"
          operator: "SubdomainOf"
          values: ["{{attributes.hostname}}"]
  resources:
    requests:
      cpu: 42mi
      memory: 256Mi
    limits:
      cpu: 4
      memory: 4Gi
```
