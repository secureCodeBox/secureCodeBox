<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->

---
title: "Developer Guide"
path: "docs/developer-guide"
category: "develop"
---

<!-- end -->

# Extending secureCodeBox

## Developing the SCB Operator

### Prerequisites

#### Golang

The operator is written in Golang. To build the operator you will need to install [Go](https://golang.org/).

#### Minikube or Kind

For local development we recommend to use [Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) or [kind](https://github.com/kubernetes-sigs/kind). If you are using MacOS or Windows you can also use the kubernetes cluster included within Docker for Mac/Windows. All of these tools will enable you to run a local kubernetes cluster on your development machine.

#### Operating Your Local Kubernetes Cluster

To operate your (local) Kubernetes cluster you will need to install [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) and [helm](https://helm.sh/)

#### macOS

For macOs simply use [Homebrew](https://brew.sh/) to install all the tools:

```bash
brew cask install docker
brew install go helm
```

After that start the `Docker.app` and go to it's settings and start Kubernetes.

#### Minio

For your local development you will need a S3 compatible storage.
We would recommend to use [Minio](https://min.io/download#/) inside a Podman or docker container.

##### If You Want to Use Podman

```bash
podman run \
  --name minio \
  -p 9000:9000 \
  minio/minio \
  server /data
```

##### If You Want to Use Docker

```bash
docker container run \
  --name minio \
  -p 9000:9000 \
  -d \
  --rm \
  minio/minio \
  server /data
```

In the Minio management GUI you will need to add a new bucket for the operator. The default credentials for your minio instance are `minioadmin:minioadmin`. You might change those. Go to the management UI at <http://localhost:9000/> and add a new bucket. After creating your bucket you will need to specify some environment variables to enable the operator to use the bucket. For that export these variables:

```bash
export S3_ACCESS_KEY="your-minio-access-key"
export S3_SECRET_KEY="your-minio-secret-key"
export S3_BUCKET="name-of-your-bucket"
export S3_USE_SSL="false" # This ensures that the operator will connect even without HTTPS
export S3_ENDPOINT="127.0.0.1:9000"
```

You can save time by using [direnv](https://direnv.net/) to export these variables in your project. If you use direnv just add a file `.s3_credentials` with your Minio credentials.

### Build and Run the Operator

To build an run the operator you can simply execute `make` in the `operator` directory of this repository:

```bash
cd operator
make
```

This will produce the operator as `bin/manager`. If you wonder why the operator is named _manager_ (the resulting binary). The reason for that is in Kubernetes a combination of more than one _controller_ is called _controller-manager_ or short _manager_. In contrast _operator_ is created by the community to name a _controller-manager_ which controls _custom resources_ and hence we use _custom resources_. (see <https://book.kubebuilder.io/> for further information)

To run the operator locally you can simply execute `make run` in the `operator` directory of this repository:

*NOTICE:* You will need to uninstall the operator with `helm -n securecodebox-system uninstall securecodebox-operator` from your local cluster, if you've installed it via helm. Unless both operators try to work on the same cluster which may cause unexpected behavior.

```bash
cd operator
make run
```

## How to add a New Security Scanner

### ScanType Definition
> ✍ **Following...**

### Parsing SDK

1. Install the dependencies `npm install`
2. Update the parser function here: `./parser/parser.js`
3. Update the parser tests here: `./parser/parser.test.js`
4. Run the test suite: `npm test`

## How to Integrate a New Hook
> ✍ **Following...**

### HookType Definition
> ✍ **Following...**

### Hook SDK
> ✍ **Following...**

## Guidelines
> ✍ **Following...**

### Coding Guidelines
> ✍ **Following...**

#### JSON

We're using snake_case (lower case) for json attributes. If an enum type is used as attribute its converted to lower case. If it's an value it's always used UPPERCASE. This is to hold the attribute api consistent, but make sure Enums are recognized as enums.

```json
{
    "id": "e18cdc5e-6b49-4346-b623-28a4e878e154",
    "name": "Open mysql Port",
    "description": "Port 3306 is open using tcp protocol.",
    "category": "Open Port",
    "osi_layer": "NETWORK",
    "severity": "INFORMATIONAL",
    "attributes": {
      "protocol": "tcp",
      "port": 3306,
      "service": "mysql",
      "mac_address": null,
      "start": "1520606104",
      "end": "1520606118",
      "ip_address": "127.0.0.1",
      "state": "open"
    },
    "location": "tcp://127.0.0.1:3306"
  }
```
