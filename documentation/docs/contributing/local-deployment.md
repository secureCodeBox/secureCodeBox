---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Local Scanner and Hook deployment
sidebar_position: 3
---

If you are integrating a new scanner or hook and want to test from a local build, this document will guide you through it.
For simplicity's sake, this guide is written only for local cluster setups using [kind](https://kind.sigs.k8s.io/).
Other setups (e.g., minikube, Docker Desktop's integrated Kubernetes) are possible but might require extra setup and tweaking efforts to run with our task files.
We also assume that you are or have followed the steps in either the [Integrating A Scanner](/docs/contributing/integrating-a-scanner) or [Integrating A Hook](/docs/contributing/integrating-a-hook) guide.

## Kind Cluster Setup

Easiest way to setup a kind cluster for running secureCodeBox for local development is to use the task `task prepare-testing-env` command.
This will start a kind cluster with the name testing-env and build the operator and deploy it to the cluster.
IF you intent to use it to run the integration tests for a scanner or hook you can skip this as the test:integration tasks will automatically set this up too, if it isn't already running.

## Taskfile-based build & deploy (recommended)

To make local testing easier, the secureCodeBox team has provided a Taskfile based solution. The specific Task targets and examples to customize them are given in these documents:

- [Taskfile targets scanners](/docs/contributing/integrating-a-scanner/taskfile)
- [Taskfile targets hooks](/docs/contributing/integrating-a-hook/taskfile)

This document explains how to use these targets to deploy your scanner locally.

**Scanner only:**
1. Inspect your scanner's Taskfile.yaml.
   If your scanner uses a remote Docker image (such as one hosted on Dockerhub), the `hasCustomScanner` variable will automatically be set to false.
   If you have defined your own Dockerfile in the `scanner/` directory, you should leave the line as-is.

2. In the root of the secureCodeBox git repository, under `hook-sdk/nodejs/` and `parser-sdk/nodejs/`, you need to build the Dockerfiles.
   This ensures that you have the latest version of the SDK available locally.
   You need this in order to build secureCodeBox parsers and hooks. To build the image:

   **Kind**: run `task build`.

3. In your scanner or hook directory, build the Dockerfiles:

   **Kind**: run `task build`.

4. Run `task deploy` to install your Helm chart in your active Kubernetes cluster into the `integration-tests` namespace.
   The task ensures that the image name and tag matches that built in the previous step.

5. Now run an example scan and inspect whether the images are correctly used.

### Example shell

```shell
securecodebox$ task prepare-testing-env
task: [create-kind-cluster] echo "Starting kind cluster for testing environment"
Starting kind cluster for testing environment
task: [create-kind-cluster] kind create cluster --name testing-env
Creating cluster "testing-env" ...
 ✓ Ensuring node image (kindest/node:v1.33.1) 🖼
 ✓ Preparing nodes 📦
 ✓ Writing configuration 📜
 ✓ Starting control-plane 🕹️
 ✓ Installing CNI 🔌
 ✓ Installing StorageClass 💾
Set kubectl context to "kind-testing-env"
You can now use your cluster with:

kubectl cluster-info --context kind-testing-env

Have a nice day! 👋
task: [build-lurker-image] echo "Building lurker image with tag ${IMG_TAG}"
task: [build-operator-image] echo "Building operator image with tag ${IMG_TAG}"
Building lurker image with tag sha-a2d8ce1aa
task: [build-lurker-image] docker build -t ${IMG_NS}/lurker:${IMG_TAG} /src/secureCodeBox/lurker
Building operator image with tag sha-a2d8ce1aa
task: [build-operator-image] docker build -t ${IMG_NS}/operator:${IMG_TAG} /src/secureCodeBox/operator
[+] Building 1.0s (4/4)                                                                                          docker:desktop-linux
[+] Building 1.0s (3/3)                                                                                          docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                             0.0s
 => [internal] load build definition from Dockerfile                                                                             0.0s
 => => transferring dockerfile: 966B                                                                                             0.0s
[+] Building 1.1s (20/20) FINISHED                                                                               docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                             0.0s
 => => transferring dockerfile: 966B                                                                                             0.0s
 => [internal] load metadata for gcr.io/distroless/static:nonroot                                                                0.4s
 => [internal] load metadata for docker.io/library/golang:1.24.5                                                                 1.0s
 => [auth] library/golang:pull token for registry-1.docker.io                                                                    0.0s
 => [internal] load .dockerignore                                                                                                0.0s
 => => transferring context: 291B                                                                                                0.0s
 => [builder  1/11] FROM docker.io/library/golang:1.24.5@sha256:30baaea08c5d1e858329c50f29fe381e9b7d7bced11a0f5f1f69a1504cdfbf5  0.0s
 => [stage-1 1/3] FROM gcr.io/distroless/static:nonroot@sha256:627d6c5a23ad24e6bdff827f16c7b60e0289029b0c79e9f7ccd54ae3279fb45f  0.0s
 => [internal] load build context                                                                                                0.0s
 => => transferring context: 2.91kB                                                                                              0.0s
 => CACHED [builder  2/11] WORKDIR /workspace                                                                                    0.0s
 => CACHED [builder  3/11] COPY go.mod go.mod                                                                                    0.0s
 => CACHED [builder  4/11] COPY go.sum go.sum                                                                                    0.0s
 => CACHED [builder  5/11] RUN go mod download                                                                                   0.0s
 => CACHED [builder  6/11] COPY main.go main.go                                                                                  0.0s
 => CACHED [builder  7/11] COPY apis/ apis/                                                                                      0.0s
 => CACHED [builder  8/11] COPY controllers/ controllers/                                                                        0.0s
 => CACHED [builder  9/11] COPY internal/ internal/                                                                              0.0s
 => CACHED [builder 10/11] COPY utils/ utils/                                                                                    0.0s
 => CACHED [builder 11/11] RUN CGO_ENABLED=0 go build -a -o manager main.go                                                      0.0s
 => CACHED [stage-1 2/3] COPY --from=builder /workspace/manager .                                                                0.0s
 => exporting to image                                                                                                           0.0s
[+] Building 1.1s (15/15) FINISHED                                                                               docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                             0.0s
 => => transferring dockerfile: 820B                                                                                             0.0s
 => [internal] load metadata for docker.io/library/golang:1.24.5                                                                 1.0s
 => [internal] load metadata for gcr.io/distroless/static:nonroot                                                                0.4s
 => [internal] load .dockerignore                                                                                                0.0s
 => => transferring context: 171B                                                                                                0.0s
 => [builder  1/11] FROM docker.io/library/golang:1.24.5@sha256:30baaea08c5d1e858329c50f29fe381e9b7d7bced11a0f5f1f69a1504cdfbf5  0.0s
 => [stage-1 1/3] FROM gcr.io/distroless/static:nonroot@sha256:627d6c5a23ad24e6bdff827f16c7b60e0289029b0c79e9f7ccd54ae3279fb45f  0.0s
 => [internal] load build context                                                                                                0.0s
 => => transferring context: 81B                                                                                                 0.0s
 => CACHED [builder  2/11] WORKDIR /workspace                                                                                    0.0s
 => CACHED [builder 3/7] COPY go.mod go.mod                                                                                      0.0s
 => CACHED [builder 4/7] COPY go.sum go.sum                                                                                      0.0s
 => CACHED [builder 5/7] RUN go mod download                                                                                     0.0s
 => CACHED [builder 6/7] COPY main.go main.go                                                                                    0.0s
 => CACHED [builder 7/7] RUN CGO_ENABLED=0 go build -a -o lurker main.go                                                         0.0s
 => CACHED [stage-1 2/3] COPY --from=builder /workspace/lurker .                                                                 0.0s
 => exporting to image                                                                                                           0.0s
 => => exporting layers                                                                                                          0.0s
 => => writing image sha256:5a13c7c870b49203029c1aa85d273e5425ad3e28ca57167c03e822d665db576a                                     0.0s
 => => naming to docker.io/securecodebox/lurker:sha-a2d8ce1aa                                                                    0.0s

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/7zgy8kalere960epa2fpujgb8

What's next:
    View a summary of image vulnerabilities and recommendations → docker scout quickview

What's next:
    View a summary of image vulnerabilities and recommendations → docker scout quickview
task: [load-operator-image] kind load docker-image ${IMG_NS}/operator:${IMG_TAG} --name testing-env
task: [load-lurker-image] kind load docker-image ${IMG_NS}/lurker:${IMG_TAG} --name testing-env
Image: "securecodebox/lurker:sha-a2d8ce1aa" with ID "sha256:5a13c7c870b49203029c1aa85d273e5425ad3e28ca57167c03e822d665db576a" not yet present on node "testing-env-control-plane", loading...
Image: "securecodebox/operator:sha-a2d8ce1aa" with ID "sha256:d72d1321720f9df4b6ead554c42f09e382ea8be9652a5bcd500cf051e3ca3981" not yet present on node "testing-env-control-plane", loading...
task: [deploy-operator] echo "Deploying secureCodeBox operator to the testing environment"
Deploying secureCodeBox operator to the testing environment
task: [deploy-operator] kubectl config use-context kind-testing-env
Switched to context "kind-testing-env".
task: [deploy-operator] kubectl create namespace integration-tests || true
namespace/integration-tests created
task: [deploy-operator] helm -n securecodebox-system upgrade --create-namespace --install securecodebox-operator /src/secureCodeBox/operator --wait \
  --set="image.repository=docker.io/${IMG_NS}/operator" \
  --set="image.tag=${IMG_TAG}" \
  --set="image.pullPolicy=IfNotPresent" \
  --set="lurker.image.repository=docker.io/${IMG_NS}/lurker" \
  --set="lurker.image.tag=${IMG_TAG}" \
  --set="lurker.image.pullPolicy=IfNotPresent"

Release "securecodebox-operator" does not exist. Installing it now.
NAME: securecodebox-operator
LAST DEPLOYED: Fri Jul 11 10:03:12 2025
NAMESPACE: securecodebox-system
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
secureCodeBox Operator Deployed 🚀

The operator can orchestrate the execution of various security scanning tools inside of your cluster.
You can find a list of all officially supported scanners here: https://www.securecodebox.io/
The website also lists other integrations, like persisting scan results to DefectDojo or Elasticsearch.

The operator send out regular telemetry pings to a central service.
This lets us, the secureCodeBox team, get a grasp on how much the secureCodeBox is used.
The submitted data is chosen to be as anonymous as possible.
You can find a complete report of the data submitted and links to the source-code at: https://www.securecodebox.io/docs/telemetry
The first ping is send one hour after the install, you can prevent this by upgrading the chart and setting `telemetryEnabled` to `false`.
```

:::note
Notice that the Task automatically feeds the chart's `AppVersion` into the `scannerVersion` build arg.
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
  - Using Taskfile: `task build`.
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
