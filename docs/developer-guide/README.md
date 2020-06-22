# Extending secureCodeBox

## Developing the SCB Operator

### Prerequisites

#### Golang

The operator is written in Golang. To build the operator you will need to install [Go](https://golang.org/).

#### Minikube or Kind

For local development we recommend to use [Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) or [kind](https://github.com/kubernetes-sigs/kind). If you are using MacOS or Windows you can also use the kubernetes cluster included within Docker for Mac/Windows. All of these tools will enable you to run a local kubernetes cluster on your development machine.

#### Operating your local kubernetes cluster

To operate your (local) kubernetes cluster you will need to install [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) and [helm](https://helm.sh/)

#### Minio

For your local development you will need a S3 compatible storage.
We would recommend to use [Minio](https://min.io/download#/) inside a podman or docker container.

##### If You Want to Use Podman

```bash
podman run --name minio -p 9000:9000 minio/minio server /data
```

##### If You Want to Use Docker

```bash
docker run --name minio -p 9000:9000 minio/minio server /data
```

In the Minio management GUI you will need to add a new bucket for the operator. The default credentials for your minio instance are `minioadmin:minioadmin`. You might change those.

After setting up your bucket you will need to specify some environment variables to enable the operator to use the bucket.
You could add these to your `.bashrc` or `.zshrc` as well.

```bash
export S3_ACCESS_KEY="your-minio-access-key"
export S3_SECRET_KEY="your-minio-secret-key"
export S3_BUCKET="name-of-your-bucket"
export S3_USE_SSL="false" # This ensures that the operator will connect even without HTTPS
export S3_ENDPOINT="<your.local.ip1address>:9000/"
```

### Build and run the operator

To build an run the operator you can simply execute *make* in the *operator* directory of this repository.

```bash
make
```

To run the operator locally you can simply execute *make run*

*NOTICE:* You will need to uninstall the operator from your local cluster first or it will result in undefined behavior!

```bash
make run
```

## How to a new security scanner

### ScanType Definition

### Parsing SDK

## How to integrate a new hook

### HookType Definition

### Hook SDK

## Guidelines

### Coding Guidelines

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
