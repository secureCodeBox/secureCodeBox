---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Installation"
sidebar_label: Installation
sidebar_position: 1
path: "docs/getting-started/installation"
---

The secureCodeBox is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. For your first steps Kubernetes from [Docker Desktop](https://www.docker.com/products/docker-desktop), [Minikube](https://minikube.sigs.k8s.io/docs/) or [KIND](https://kind.sigs.k8s.io/) is sufficient. We also provide a [Vagrant](https://www.vagrantup.com/) based all-in-one installation (see [below](#vagrant-all-in-one-installation)).

First of all you need to install the secureCodeBox Operator which is responsible for starting all security scans.

```bash
# Add the secureCodeBox Helm Repo
helm repo add secureCodeBox https://charts.securecodebox.io

# Create a new namespace for the secureCodeBox Operator
kubectl create namespace securecodebox-system

# Install the Operator & CRD's
helm --namespace securecodebox-system upgrade --install securecodebox-operator secureCodeBox/operator
```

If you didn't see any errors you now have the secureCodeBox Operator up and running! 🥳 🚀

Your now ready to install your [first scan types and start your first scans](/docs/getting-started/first-scans).

## Version Support

The secureCodeBox supports the 4 latest Kubernetes releases (`v1.27`, `v1.26`, `v1.25` & `v1.24`). Older version might also work but are not officially supported or tested.

## Accessing the included MinIO Instance

The default secureCodeBox Operator includes a [MinIO](https://min.io/) instance, which acts as a local S3 filestorage API used by the secureCodeBox to store the results files of its scans. You can switch it out with a S3 compatible API provided by most cloud providers.

You can access the MinIO instance included in the default installation like the following:

Port Forward MinIO UI: `kubectl port-forward -n securecodebox-system service/securecodebox-operator-minio 9000:9001`

- AccessKey: `kubectl get secret securecodebox-operator-minio -n securecodebox-system -o=jsonpath='{.data.root-user}' | base64 --decode; echo`
- SecretKey: `kubectl get secret securecodebox-operator-minio -n securecodebox-system -o=jsonpath='{.data.root-password}' | base64 --decode; echo`

Then open your browser on [http://localhost:9000](http://localhost:9000) and login in with the credentials returned by the command listed above.

If you find yourself running these snippets regularly, you might want to check out this [helper script](https://github.com/secureCodeBox/secureCodeBox/blob/main/bin/minio-port-forward.sh)

## Operator Configuration Options

### Using a hosted S3 Buckets as storage backend

To change out the default MinIO instance with a S3 Bucket from a cloud provider you can update the helm values to connect the operator with you S3 bucket.

#### AWS S3 Buckets

```yaml
minio:
  # disable the local minio instance
  enabled: false
s3:
  enabled: true
  # update the region to match the location of your bucket
  endpoint: "s3.eu-west-1.amazonaws.com"
  bucket: "your-own-securecodebox-bucket-name"
  # Name to a k8s secret with 'accesskey' and 'secretkey' as attributes in the same namespace as this release
  # Example creation via kubectl:
  # kubectl create secret generic securecodebox-s3-credentials --from-literal=accesskey="******" --from-literal=secretkey="******"
  keySecret: securecodebox-s3-credentials
```

#### Google Cloud Storage

```yaml
minio:
  # disable the local minio instance
  enabled: false
s3:
  enabled: true
  bucket: your-own-securecodebox-bucket-name
  endpoint: storage.googleapis.com
  # Name to a k8s secret with 'accesskey' and 'secretkey' as attributes in the same namespace as this release
  # Example creation via kubectl:
  # kubectl create secret generic gcs-bucket-credentials --from-literal=accesskey="******" --from-literal=secretkey="******"
  keySecret: gcs-bucket-credentials
```

## Install SCB Scanner

The following list will give you a short overview of all supported security scanner charts and how to install them.
You will find a more detailed documentation for each scanner in our _Scanners_ documentation section.

:::note
If you are installing the secureCodeBox the first time we recommend to read the [first scans](/docs/getting-started/first-scans) documentation first.
:::

You can optionally deploy SCB scanner charts for each security scanner you want to use. They should not be installed into the securecodebox-system namespace like the operator, but into the individual namespaces where you want to run the scans.

```bash
# The following chart will be installed in the `default` namespace by you can choose the namespace of your choice by
# adding `--namespace YOURNAMESPACE` to each line
helm upgrade --install amass secureCodeBox/amass
helm upgrade --install gitleaks secureCodeBox/gitleaks
helm upgrade --install kube-hunter secureCodeBox/kube-hunter
helm upgrade --install nikto secureCodeBox/nikto
helm upgrade --install nmap secureCodeBox/nmap
helm upgrade --install ssh-scan secureCodeBox/ssh-scan
helm upgrade --install sslyze secureCodeBox/sslyze
helm upgrade --install trivy secureCodeBox/trivy
helm upgrade --install wpscan secureCodeBox/wpscan
helm upgrade --install zap secureCodeBox/zap
```

## Install some demo targets

If you want to test some of the security scanners within your namespace you can use some demo targets.

:::danger
As these demo targets are intentionally vulnerable you shouldn't expose them to the internet - keep them internal.
Otherwise you could be targeted by someone else really fast 😈
:::

```bash
helm upgrade --install dummy-ssh secureCodeBox/dummy-ssh
helm upgrade --install bodgeit secureCodeBox/bodgeit
helm upgrade --install juice-shop secureCodeBox/juice-shop
helm upgrade --install old-wordpress secureCodeBox/old-wordpress
helm upgrade --install swagger-petstore secureCodeBox/swagger-petstore
```

:::note
These charts will be installed in the `default` namespace, but you can choose the namespace of your choice by adding `--namespace YOURNAMESPACE` to each helm command.
:::

## Vagrant All-in-one Installation

We provide a [Vagrant](https://www.vagrantup.com/) setup with everything installed (Kubernetes cluster, operator, scanners, hooks, demo applications, etc.). You only need [Vagrant installed](https://www.vagrantup.com/docs/installation) and our main repository to play around with secureCodeBox:

```bash
git clone https://github.com/secureCodeBox/secureCodeBox.git
cd secureCodeBox
vagrant up
```

After this setup has finished just ssh into the vagrant box:

```bash
vagrant ssh
```

Now you can [start with your first scan](/docs/getting-started/first-scans).

## Troubleshooting

### MinIO Startup Problems

If your secureCodeBox Operator install is failing, and you see that the operator pod seems to be working okay, but the MinIO pods started alongside it does not start up properly, your cluster probably isn't configured to have a working default [Storage Class for Persistent Volumes](https://kubernetes.io/docs/concepts/storage/storage-classes/).

Suggested solutions:

- Use a Cloud Storage provider instead of MinIO. This has to provide a API compatible to AWS S3. Providers that we have tried and worked great include:
  - AWS S3
  - Google Cloud Storage
  - DigitalOcean Spaces
- Configure MinIO to use a HostPath Volume. This is more work to set up and manage, but also works for local / on-prem installation.

### ClusterRole & CRD Issues

The secureCodeBox Operator Helm Chart contains Custom Resource Definitions and ClusterRoles which is usually reserved to administrators of production cluster (and rightfully so 😄). If you are just testing out the secureCodeBox consider using a local Kubernetes Cluster with tools like [kind](https://kind.sigs.k8s.io/), [minikube](https://minikube.sigs.k8s.io/docs/) or [Docker Desktops (Mac/Windows) Kubernetes cluster](https://www.docker.com/products/kubernetes).

### Running on Windows

There are multiple ways to install Kubernetes and Helm to run secureCodeBox on Windows. One easy method is to install [Docker Desktop](https://www.docker.com/products/docker-desktop) then enable Kubernetes in the Settings. While installing a current version of Docker Desktop you will be prompted to install Linux Subsystem for Windows (WSL2). Now you can continue the installation on either Windows or the Linux Subsystem.

- For Windows: Install [Helm](https://helm.sh) for Windows like instructed on the website. Usually installing from Binaries will be easy.
- For Linux Subsystem: Install the Linux Distribution of your choice from the Microsoft Store (Ubuntu 18.04 works fine). Now install [Helm](https://helm.sh) for the chosen Distribution (e.g. using Apt for Ubuntu).
