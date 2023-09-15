<!--
SPDX-FileCopyrightText: 2021 iteratec GmbH

SPDX-License-Identifier: Apache-2.0
-->

## Usage
The auto-discovery-secret-extraction container should be used as an initContainer to enable Trivy (or other container scan tools) to scan images from private docker registries. The container expects the imageID for which it should find the corresponding secret and the name of the temporary secret as commandline arguments. The initContainer will then read secrets mounted as a volume under `/secrets` and check which secret belongs to the domain of the provided imageID. After the correct secret is identified it will create a temporary secret which will contain the credentials of the private registry of the provided imageID. The temporary secret will have an `ownerReference` to the pod in which this container is running in. This means that the temporary secret will be automatically removed when the scan of the pod is finished.

## Running a local docker registry
The easiest way to test the initContainer locally is to deploy a local registry using docker outside of the k8s cluster to be able to delete the cluster without recreating the registry every time.
### Creating a local registry with authentication 
1. Create basic auth secrets
```bash
 mkdir auth
 docker run \
  --entrypoint htpasswd \
  httpd:2 -Bbn testuser testpassword > auth/htpasswd

```
2. Start registry container (Commands adapted from [Docker docs](https://docs.docker.com/registry/deploying/))
```bash
docker run -d \
  -p "127.0.0.1:5000:5000" \
  --name registry \
  --restart=always \
  -v "$(pwd)"/auth:/auth \
  -e "REGISTRY_AUTH=htpasswd" \
  -e "REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm" \
  -e REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd \
  registry:2
```
3. Login into newly created docker registry
```bash
docker login localhost:5000 -u testuser -p testpassword
```
4. Create kind cluster with the local registry configured (Commands adapted from [kind docs](https://kind.sigs.k8s.io/docs/user/local-registry/))
```bash
cat <<EOF | kind create cluster --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
containerdConfigPatches:
- |-
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5000"]
    endpoint = ["http://registry:5000"]
  [plugins."io.containerd.grpc.v1.cri".registry.configs."registry:5000".tls]
    insecure_skip_verify = true

EOF

docker network connect "kind" "registry"

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: local-registry-hosting
  namespace: kube-public
data:
  localRegistryHosting.v1: |
    host: "localhost:5000"
    help: "https://kind.sigs.k8s.io/docs/user/local-registry/"
EOF
```
5. Push an image to the local registry
```bash
docker pull ubuntu
docker tag ubuntu localhost:5000/ubuntu
docker push localhost:5000/ubuntu
```
6. Create a pod running an image from the local registry
```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: regcred
  namespace: default
data:
  .dockerconfigjson: ewoJImF1dGhzIjogewoJCSJsb2NhbGhvc3Q6NTAwMCI6IHsKCQkJImF1dGgiOiAiZEdWemRIVnpaWEk2ZEdWemRIQmhjM04zYjNKayIKCQl9Cgl9Cn0=
type: kubernetes.io/dockerconfigjson
---

apiVersion: v1
kind: Pod 
metadata:
  name: private-reg
  namespace: default
spec:
  containers:
  - name: private-reg-container
    image: localhost:5000/ubuntu
    command: ["sleep"]
    args: ["999999"]
  imagePullSecrets:
  - name: regcred
EOF
```