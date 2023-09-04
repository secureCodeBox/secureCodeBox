---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Modifying the Operator"
sidebar_position: 4
---

## Prerequisites

### Golang

The operator is written in Golang. To build the operator you will need to install [Go](https://golang.org/).

### Local Kubernetes Environment

For local development we recommend to use [Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) or [kind](https://github.com/kubernetes-sigs/kind). If you are using MacOS or Windows you can also use the kubernetes cluster included within Docker for Mac/Windows. All of these tools will enable you to run a local kubernetes cluster on your development machine.

### Operating Your Local Kubernetes Cluster

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
We would recommend to use [Minio](https://min.io/download#/) inside a docker container.

```bash
docker container run \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -d \
  --rm \
  minio/minio \
  server /data \
  --console-address ":9001"
```

In the Minio management GUI you will need to add a new bucket for the operator. The default credentials for your minio instance are `minioadmin:minioadmin`. You might change those. Go to the management UI at <http://localhost:9001/> and add a new bucket. After creating your bucket you will need to specify some environment variables to enable the operator to use the bucket. For that export these variables:

```bash
export MINIO_ACCESS_KEY="your-minio-access-key"
export MINIO_SECRET_KEY="your-minio-secret-key"
export S3_BUCKET="name-of-your-bucket"
export S3_USE_SSL="false" # This ensures that the operator will connect even without HTTPS
export S3_ENDPOINT="127.0.0.1:9000"
```

You can save time by using [direnv](https://direnv.net/) to export these variables in your project. If you use direnv just add a file `.s3_credentials` with your Minio credentials.

### Build and Run the Operator

To build and run the operator you can simply execute `make` in the `operator` directory of this repository:

```bash
cd operator
make
```

This will produce the operator as `bin/manager`. If you wonder why the operator is named _manager_ (the resulting binary). The reason for that is in Kubernetes a combination of more than one _controller_ is called _controller-manager_ or short _manager_. In contrast, _operator_ is created by the community to name a _controller-manager_ which controls _custom resources_ and hence we use _custom resources_. (see <https://book.kubebuilder.io/> for further information)

To run the operator locally you can simply execute `make run` in the `operator` directory of this repository:

_NOTICE:_ You will need to uninstall the operator with `helm -n securecodebox-system uninstall securecodebox-operator` from your local cluster, if you've installed it via helm. Unless both operators try to work on the same cluster which may cause unexpected behavior.

```bash
cd operator
make run
```

To run multiple operator instances locally (e.g. SCB operator and SCB Autodiscovery operator) the `metrics-bind-address` and `health-probe-bind-address` port needs to be changed via commandline arguements for one of the operators.<br/>
```
go run ./main.go -metrics-bind-address :9090 -health-probe-bind-address :9595
```

