---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "System Scope and Context"
sidebar_label: "System Scope and Context"
sidebar_position: 3
---
# System Scope and Context {#section-system-scope-and-context}

_secureCodeBox_ is an orchestration platform managing scans with various security tools and processing the results. The aim of this project is to make automated vulnerability scanning easy and efficient. The diagrams below illustrate the external factors and the context in which _secureCodeBox_ is used.

_secureCodeBox_ only manages the scan execution. The scanning functionality itself is considered out of scope and relies on third-party security scanners.

## Context Boundary {#_business_context}

The following diagram shows the_secureCodeBox_ as blackbox system and all other systems and actors depending on _secureCodeBox_ or _secureCodeBox_ depends on. The arrows in the diagram indicate the direction of the dependency: The system which "points with the arrow" to another system means that it depends on that other system and can't fully operate without this system.  

![Context boundary diagram](/img/docs/architecture/context-boundary-diagram.png)

### Systems

The following table describes the systems _secureCodeBox_ interacts with. The description is deliberately brief. The details of the used APIs are documented in the [building block view](/docs/architecture/building_block_view).

| System              | Description                                                                                                                           |
|:--------------------|:--------------------------------------------------------------------------------------------------------------------------------------|
| _secureCodeBox_     | This is the main system we discuss in this documentation.                                                                             |
| _Container Runtime_ | _secureCodeBox_ depends on a container runtime (e.g. [Docker][docker], [Podman][podman] etc.) to build the container images.          |
| _DockerHub_         | _secureCodeBox_ depends on the public services from [DockerHub][docker-hub] to push/pull container images.                            |
| _Kubernetes_        | [Kubernetes][k8s] is the main foundation of the _secureCodeBox_. We heavily rely on the API and _Custom Resources_.                   |
| _Helm_              | _secureCodeBox_ uses [Helm][helm] to build, publish and install the containers via _charts_ in [Kubernetes][k8s].                     |
| _S3_                | _secureCodeBox_ depends on an [S3 API][s3-api] compliant backend to store its persistent data.                                        |
| _3rd Party Tool_    | (**optional**) _secureCodeBox_ can import findings into other tools.                                                                  |
| _Scanner Tools_     | _secureCodeBox_ depends on [various security scanner](/docs/scanners) tools.                                                          |
| _CI/CD_             | _Continuous Integration_ (CI) and _Continuous Deployment_ (CD) systems which may initialize a scan.                                   | 

### Roles

The following table describes the roles interacting with _secureCodeBox_.

| Role      | Description                                                                                                                                         |
|:----------|:----------------------------------------------------------------------------------------------------------------------------------------------------|
| Operator  | The role which operates the _secureCodeBox_ installation. (Do not confuse with Kubernetes _operator_ pattern, which we implement for the _engine_.) |
| Tester    | The role which utilizes _secureCodeBox_ to perform security tests.                                                                                  |
| Developer | The role which develops the _secureCodeBox_.                                                                                                        |

[artifact-hub]: https://artifacthub.io/docs/
[docker]:       https://www.docker.com/
[docker-hub]:   https://hub.docker.com/
[helm]:         https://helm.sh/
[k8s]:          https://kubernetes.io/
[podman]:       https://podman.io/
[s3-api]:       https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html
