<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->
<!--
.: IMPORTANT! :.
--------------------------
This file is generated automatically with `helm-docs` based on the following template files:
- ./.helm-docs/templates.gotmpl (general template data for all charts)
- ./chart-folder/.helm-docs.gotmpl (chart specific template data)

Please be aware of that and apply your changes only within those template files instead of this file.
Otherwise your changes will be reverted/overwritten automatically due to the build process `./.github/workflows/helm-docs.yaml`
--------------------------
-->

<p align="center">
  <a href="https://opensource.org/licenses/Apache-2.0"><img alt="License Apache-2.0" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/releases/latest"><img alt="GitHub release (latest SemVer)" src="https://img.shields.io/github/v/release/secureCodeBox/secureCodeBox?sort=semver"/></a>
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Lab Project" src="https://img.shields.io/badge/OWASP-Lab%20Project-yellow"/></a>
  <a href="https://artifacthub.io/packages/search?repo=securecodebox"><img alt="Artifact HUB" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/securecodebox"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/secureCodeBox/secureCodeBox?logo=GitHub"/></a>
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"/></a>
</p>

## What is OWASP secureCodeBox?

<p align="center">
  <img alt="secureCodeBox Logo" src="https://www.securecodebox.io/img/Logo_Color.svg" width="250px"/>
</p>

_[OWASP secureCodeBox][scb-github]_ is an automated and scalable open source solution that can be used to integrate various *security vulnerability scanners* with a simple and lightweight interface. The _secureCodeBox_ mission is to support *DevSecOps* Teams to make it easy to automate security vulnerability testing in different scenarios.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The secureCodeBox project is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. It is also possible to start the different integrated security vulnerability scanners based on a docker infrastructure.

### Quickstart with secureCodeBox on kubernetes

You can find resources to help you get started on our [documentation website](https://www.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://www.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://www.securecodebox.io/docs/getting-started/first-scans) with it.

## What is Trivy?

`Trivy` (`tri` pronounced like **tri**gger, `vy` pronounced like en**vy**) is a simple and comprehensive vulnerability scanner for containers and other artifacts.
A software vulnerability is a glitch, flaw, or weakness present in the software or in an Operating System.
`Trivy` detects vulnerabilities of OS packages (Alpine, RHEL, CentOS, etc.) and application dependencies (Bundler, Composer, npm, yarn, etc.).
`Trivy` is easy to use. Just install the binary, and you're ready to scan. All you need to do for scanning is to specify a target such as an image name of the container.

To learn more about the Trivy scanner itself visit [Trivy's GitHub Repository](https://github.com/aquasecurity/trivy).

## Deployment
The trivy chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install trivy secureCodeBox/trivy
```

## Scanner Configuration

The following security scan configuration example are based on the [Trivy Documentation](https://aquasecurity.github.io/trivy/), please take a look at the original documentation for more configuration examples.

### Trivy Container Image Scan

Currently we support the follwing 3 scanTypes, corresponding to the trivy scanning modes:
- scanType: "trivy-image"
   - parameters: `[YOUR_IMAGE_NAME]`
- scanType: "trivy-filesystem"
   - parameters: `[YOUR_PATH_TO_FILES]`
- scanType: "trivy-repo"
   - parameters: `[YOUR_GITHUB_REPO]`

A complete example of each scanType are listed below in our [example docs section](https://www.securecodebox.io/docs/scanners/trivy/#examples).

Simply specify an image name (and a tag) when you use the scanType `trivy-image`. But there are also some additional configuration options e.g:
- Filter the vulnerabilities by severities `--severity HIGH,CRITICAL ruby:2.4.0`
- Filter the vulnerabilities by type (`os` or `library`) `--vuln-type os ruby:2.4.0`
- Skip update of vulnerability DB: `--skip-update python:3.4-alpine3.9`
- Ignore unfixed vulnerabilities:`--ignore-unfixed ruby:2.4.0` By default, Trivy also detects unpatched/unfixed vulnerabilities. This means you can't fix these vulnerabilities even if you update all packages. If you would like to ignore them, use the `--ignore-unfixed` option.

A complete scan definition for the secureCodeBox repository may look something like this:
```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "trivy-scb"
spec:
  scanType: "trivy-image"
  parameters:
    - bkimminich/juice-shop:v10.2.0
```

### Scanning Many Targets
By default, the docker container of trivy will download new rulesets when starting the process.
As this download is performed directly from GitHub, you will run into API rate limiting issues after roughly 50 requests.
Trivy [supports a client-server mode](https://aquasecurity.github.io/trivy/latest/advanced/modes/client-server/) where one process downloads a copy of the rule database and provides it to the others.
Due to [limitations in trivy](https://github.com/aquasecurity/trivy/issues/634), this mode currently only supports scanning container images.
If this fits your use case, you can deploy a rule service with the following template:
```yaml
# First declare a service that will serve requests to the rule pod
kind: Service
apiVersion: v1
metadata:
  name: trivy-rules
  # Update the namespace here if you are using a different one
  namespace: default
  labels:
    app: trivy-rules
spec:
  selector:
    app: trivy-rules
  ports:
  - port: 8080
    protocol: TCP
    targetPort: 8080
  type: ClusterIP
---
# Now declare the actual deployment of the rule server
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trivy-rules
  # Again, update the namespace here
  namespace: default
  labels:
    app: trivy-rules
spec:
  replicas: 1
  selector:
    matchLabels:
      app: trivy-rules
  template:
    metadata:
      labels:
        app: trivy-rules
    spec:
      containers:
      - name: trivy-rules
        # Don't forget to set this to a version matching that used in secureCodeBox
        image: aquasec/trivy:0.20.2
        imagePullPolicy: Always
        args:
        - "server"
        - "--listen"
        - "0.0.0.0:8080"
        ports:
        - containerPort: 8080
          protocol: TCP
```

You can then start scans of images using the client mode. For example:

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "test-trivy"
  # Don't forget to update the namespace if necessary
  namespace: default
spec:
  scanType: "trivy-image"
  parameters:
    - "client"
    # Again, add the extra parameters here (required to make the parser work)
    # But don't add the --no-progress switch.
    - "--format"
    - "json"
    - "--output"
    - "/home/securecodebox/trivy-results.json"
    # Specify the rule service internal DNS name here.
    # (Substitute a different namespace if you changed it)
    - "--remote"
    - "http://trivy-rules.default.svc:8080"
    # Finally, specify the image you want to scan
    - "securecodebox/operator:3.0.0"
```

If you want to scan anything other than docker images, you currently [cannot use the client-server mode](https://github.com/aquasecurity/trivy/issues/634) described above.
Instead, you have to [manually download the ruleset and provide it to trivy](https://aquasecurity.github.io/trivy/latest/advanced/air-gap/).
In practice, this is a difficult problem because the most natural method for providing these files in kubernetes, ConfigMaps, has a size limit of 1 MB, while the vulnerability database is over 200 MB in size (28 MB after compression).
Your best bet would thus be to serve the files from your own servers and load them into the scanner [using an initContainer](https://www.securecodebox.io/docs/api/crds/scan#initcontainers-optional), taking care to keep the databases on your server up to date.
Consult the [trivy documentation](https://aquasecurity.github.io/trivy/latest/advanced/air-gap/) for additional details on the required steps.

## Requirements

Kubernetes: `>=v1.11.0-0`

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| cascadingRules.enabled | bool | `false` | Enables or disables the installation of the default cascading rules for this scanner |
| imagePullSecrets | list | `[]` | Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/) |
| parser.affinity | object | `{}` | Optional affinity settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| parser.env | list | `[]` | Optional environment variables mapped into each parseJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| parser.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| parser.image.repository | string | `"docker.io/securecodebox/parser-trivy"` | Parser image repository |
| parser.image.tag | string | defaults to the charts version | Parser image tag |
| parser.resources | object | { requests: { cpu: "200m", memory: "100Mi" }, limits: { cpu: "400m", memory: "200Mi" } } | Optional resources lets you control resource limits and requests for the parser container. See https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ |
| parser.scopeLimiterAliases | object | `{}` | Optional finding aliases to be used in the scopeLimiter. |
| parser.tolerations | list | `[]` | Optional tolerations settings that control how the parser job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| parser.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the parser will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |
| scanner.activeDeadlineSeconds | string | `nil` | There are situations where you want to fail a scan Job after some amount of time. To do so, set activeDeadlineSeconds to define an active deadline (in seconds) when considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-termination-and-cleanup) |
| scanner.affinity | object | `{}` | Optional affinity settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes-using-node-affinity/) |
| scanner.backoffLimit | int | 3 | There are situations where you want to fail a scan Job after some amount of retries due to a logical error in configuration etc. To do so, set backoffLimit to specify the number of retries before considering a scan Job as failed. (see: https://kubernetes.io/docs/concepts/workloads/controllers/job/#pod-backoff-failure-policy) |
| scanner.env | list | `[]` | Optional environment variables mapped into each scanJob (see: https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/) |
| scanner.extraContainers | list | `[]` | Optional additional Containers started with each scanJob (see: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) |
| scanner.extraVolumeMounts | list | `[]` | Optional VolumeMounts mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.extraVolumes | list | `[]` | Optional Volumes mapped into each scanJob (see: https://kubernetes.io/docs/concepts/storage/volumes/) |
| scanner.image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| scanner.image.repository | string | `"docker.io/aquasec/trivy"` | Container Image to run the scan |
| scanner.image.tag | string | `nil` | defaults to the charts appVersion |
| scanner.nameAppend | string | `nil` | append a string to the default scantype name. |
| scanner.podSecurityContext | object | `{}` | Optional securityContext set on scanner pod (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.resources | object | `{}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| scanner.securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":false,"runAsNonRoot":false}` | Optional securityContext set on scanner container (see: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) |
| scanner.securityContext.allowPrivilegeEscalation | bool | `false` | Ensure that users privileges cannot be escalated |
| scanner.securityContext.capabilities.drop[0] | string | `"all"` | This drops all linux privileges from the container. |
| scanner.securityContext.privileged | bool | `false` | Ensures that the scanner container is not run in privileged mode |
| scanner.securityContext.readOnlyRootFilesystem | bool | `false` | Prevents write access to the containers file system |
| scanner.securityContext.runAsNonRoot | bool | `false` | Enforces that the scanner image is run as a non root user |
| scanner.tolerations | list | `[]` | Optional tolerations settings that control how the scanner job is scheduled (see: https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) |
| scanner.ttlSecondsAfterFinished | string | `nil` | seconds after which the kubernetes job for the scanner will be deleted. Requires the Kubernetes TTLAfterFinished controller: https://kubernetes.io/docs/concepts/workloads/controllers/ttlafterfinished/ |

## Contributing

Contributions are welcome and extremely helpful 🙌
Please have a look at [Contributing](./CONTRIBUTING.md)

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [Slack][scb-slack]
- [Twitter][scb-twitter]

secureCodeBox is an official [OWASP][scb-owasp] project.

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://www.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE

