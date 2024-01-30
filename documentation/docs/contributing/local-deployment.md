---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Local Scanner and Hook deployment
sidebar_position: 3
---

If you are integrating a new scanner or hook and want to test from a local build, this document will guide you through it.
:::note
Currently, we only offer the option of local deployment using a [kind](https://kind.sigs.k8s.io/) cluster.
:::
This guide assumes that you have your Kubernetes cluster, installed via [kind](https://kind.sigs.k8s.io/), already up and running, and that we can work in your default namespace. If not, check out the [installation](/docs/getting-started/installation/) for more information.
We also assume that you are or have followed the steps in either the [Integrating A Scanner](/docs/contributing/integrating-a-scanner) or [Integrating A Hook](/docs/contributing/integrating-a-hook) guide.

## Makefile-based build & deploy (recommended)

To make local testing easier, the secureCodeBox team has provided a Makefile based solution. The specific Make targets and examples to customize them are given in these documents:

- [Makefile targets scanners](/docs/contributing/integrating-a-scanner/makefile)
- [Makefile targets hooks](/docs/contributing/integrating-a-hook/makefile)

This document explains how to use these targets to deploy your scanner locally.

**Scanner only:**
1. Inspect your scanner's Makefile.
   If your scanner uses a remote Docker image (such as one hosted on Dockerhub), you can comment out or remove the `custom_scanner` line.
   If you have defined your own Dockerfile in the `scanner/` directory, you should leave the line as-is.

2. In the root of the secureCodeBox git repository, under `hook-sdk/nodejs/` and `parser-sdk/nodejs/`, you need to build the Dockerfiles.
   This ensures that you have the latest version of the SDK available locally.
   You need this in order to build secureCodeBox parsers and hooks. To build the image:

   **Kind**: run `make docker-build`.

3. In your scanner or hook directory, build the Dockerfiles:

   **Kind**: run `make docker-build docker-export kind-import`.

4. Run `kubectl create namespace integration-tests` to create a new namespace for local tests.

5. Run `make deploy` to install your Helm chart in your active Kubernetes cluster into the `integration-tests` namespace.
   The make target ensures that the image name and tag matches that built in the previous step.

6. Now run an example scan and inspect whether the images are correctly used.

### Example shell

```shell
securecodebox$ kind create cluster
Creating cluster "kind" ...
 ✓ Ensuring node image (kindest/node:v1.27.3) 🖼
 ✓ Preparing nodes 📦  
 ✓ Writing configuration 📜 
 ✓ Starting control-plane 🕹️ 
 ✓ Installing CNI 🔌 
 ✓ Installing StorageClass 💾 
Set kubectl context to "kind-kind"
[...]
securecodebox$ helm repo add secureCodeBox https://charts.securecodebox.io
[...]
securecodebox$ kubectl create namespace securecodebox-system
namespace/securecodebox-system created
securecodebox$ helm --namespace securecodebox-system upgrade --install securecodebox-operator secureCodeBox/operator
Release "securecodebox-operator" does not exist. Installing it now.
NAME: securecodebox-operator
LAST DEPLOYED: Fri Jan 26 14:34:50 2024
NAMESPACE: securecodebox-system
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
secureCodeBox Operator Deployed 🚀
[...]
securecodebox$ cd parser-sdk/nodejs/
securecodebox/parser-sdk/nodejs$ make docker-build
.: ⚙️ Build 'parser-sdk'.
docker build -t securecodebox/parser-sdk-nodejs:"sha-$(git rev-parse --short HEAD)" .
[...]
Successfully built af5faaf0be6e
Successfully tagged securecodebox/parser-sdk-nodejs:sha-a4490167
securecodebox/parser-sdk/nodejs$ cd ../../scanners/nmap/
securecodebox/scanners/nmap$ make docker-build docker-export kind-import
.: ⚙️ Build 'nmap' parser with BASE_IMG_TAG: 'sha-a4490167'.
[...]
[Warning] One or more build-args [scannerVersion] were not consumed
Successfully built 931ac83a3e42
Successfully tagged securecodebox/parser-nmap:sha-a4490167
.: ⚙️ Build 'nmap' scanner with BASE_IMG_TAG: 'sha-a4490167'.
[...]
[Warning] One or more build-args [baseImageTag namespace] were not consumed
Successfully built 721c154357eb
Successfully tagged securecodebox/scanner-nmap:sha-a4490167
.: ⚙️ Saving new docker image archive to 'parser-nmap.tar'.
.: ⚙️ Saving new docker image archive to 'scanner-nmap.tar'.
.: 💾 Importing the image archive 'parser-nmap.tar' to local kind cluster.
.: 💾 Importing the image archive 'scanner-nmap.tar' to local kind cluster.
securecodebox/scanners/nmap$ kubectl create namespace integration-tests
namespace/integration-tests created
securecodebox/scanners/nmap$ make deploy
.: 💾 Deploying 'nmap' scanner HelmChart with the docker tag 'sha-a4490167' into kind namespace 'integration-tests'.
[...]
Release "nmap" does not exist. Installing it now.
NAME: nmap
LAST DEPLOYED: Fri Jan 26 14:35:27 2024
NAMESPACE: integration-tests
STATUS: deployed
REVISION: 1
TEST SUITE: None
securecodebox/scanners/nmap$ kubectl get scantypes.execution.securecodebox.io -n integration-tests
NAME   IMAGE
nmap   docker.io/securecodebox/scanner-nmap:sha-a4490167
securecodebox/scanners/nmap$ kubectl get parsedefinitions.execution.securecodebox.io -n integration-tests
NAME       IMAGE
nmap-xml   docker.io/securecodebox/parser-nmap:sha-a4490167
```

:::note
Notice that the Make target automatically feeds the chart's `AppVersion` into the `scannerVersion` build arg.
:::

## Manual build & deploy

### Scanner & Parser

1. Build your scanner image

```shell
securecodebox/scanners/your-custom-scanner/scanner$ docker build \
		--build-arg=scannerVersion="7.91-r0" \
		-t your-custom-scanner:local-dev \
		.
```

2. **Kind only**: import your scanner image

```shell
securecodebox$ kind load docker-image your-custom-scanner:local-dev
```

3. Build Parser SDK

```shell
securecodebox/parser-sdk/nodejs$ docker build -t securecodebox/parser-sdk-nodejs:local-dev .
```

4. Build your parser image

```shell
securecodebox/scanners/your-custom-scanner/parser$ docker build \
		--build-arg=baseImageTag="local-dev" \
		--build-arg=namespace=securecodebox \
		-t your-custom-parser:local-dev \
		.
```

5. **Kind only**: import your parser image

```shell
securecodebox$ kind load docker-image your-custom-parser:local-dev
```

6. Update deployment image references.
   Change the fields in `values.yaml` file like this:

```yaml
parser:
  image:
    repository: your-custom-parser
    pullPolicy: Never
    tag: local-dev
scanner:
  image:
    repository: your-custom-scanner
    pullPolicy: Never
    tag: local-dev
```

### Hook

1. Build Hook SDK

```shell
securecodebox/hook-sdk/nodejs$ docker build -t securecodebox/hook-sdk-nodejs:local-dev .
```

2. Build hook

```shell
securecodebox/hooks/your-custom-hook/hook/$ docker build \
		--build-arg=baseImageTag="local-dev" \
		--build-arg=namespace=securecodebox \
		-t your-custom-hook:local-dev \
		.
```

3. **Kind only**: import your hook image

```shell
securecodebox$ kind load docker-image your-custom-hook:local-dev
```

4. Update deployment image references.
   Change the fields in `values.yaml` file like this:

```yaml
hook:
  image:
    repository: your-custom-hook
    tag: local-dev
    pullPolicy: Never
```

5. Deploy the scanner.

```shell
securecodebox/hooks/your-custom-hook/$ helm upgrade --install your-custom-hook .
```

## Debugging

### `ImagePullBackOff`

Kubernetes is reporting that it isn't able to find the specified image.
Check with `kubectl describe pod [name of pod]` which image your scanner wants to use and whether you have made that image available.
Check your Docker build logs to verify that the image has been correctly tagged.
You can also check if the image is actually available:

- **Kind**: `docker exec kind-control-plane crictl images`

Don't forget that all images used in your Kubernetes cluster must be either remotely accessible or locally available within the cluster.

- **Kind**: imported after building
  - Using Makefile: `make docker-export kind-import`.
  - Manually: `kind load docker-image parser-nmap:[tag]`.

### Namespace

In some cases, you might accidentally install secureCodeBox in an unexpected namespace.
Check that you don't have any left-over releases installed.

```shell
$ helm list --all-namespaces
NAME                  	NAMESPACE           	REVISION	UPDATED                                	STATUS  	CHART                               	APP VERSION
nmap                  	integration-tests   	1       	2021-11-18 15:00:14.712583292 +0100 CET	deployed	nmap-v3.1.0-alpha1                  	7.91-r0
securecodebox-operator	securecodebox-system	1       	2021-11-18 10:09:24.804277463 +0100 CET	deployed	operator-v3.1.0-alpha1
update-category       	integration-tests   	1       	2021-11-18 11:18:45.104860436 +0100 CET	deployed	update-field-hook-v3.1.0-alpha1
update-severity       	integration-tests   	1       	2021-11-18 11:18:45.267164462 +0100 CET	deployed	update-field-hook-v3.1.0-alpha1
```

You can install secureCodeBox components in any namespace, however verify that you are starting your scans in the same namespace as where you deployed your scanner or hook.

```shell
$ kubectl apply -f ./nmap-scan.yaml -n integration-tests
scan.execution.securecodebox.io/nmap created
$ kubectl get scans -A
NAMESPACE           NAME   TYPE   STATE   FINDINGS
integration-tests   nmap   nmap   Done    1
```
