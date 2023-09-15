#!/bin/sh

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: regcred
  namespace: integration-test
data:
  .dockerconfigjson: ewoJImF1dGhzIjogewoJCSJmYWtlLXJlZ2lzdHJ5Lnh5eiI6IHsKCQkJImF1dGgiOiAiZEdWemRIVnpaWEk2ZEdWemRIQmhjM04zYjNKayIKCQl9Cgl9Cn0=
type: kubernetes.io/dockerconfigjson

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: initcontainer-secret-create
  namespace: integration-test
---
apiVersion: v1
kind: Pod 
metadata:
  name: init-container-test
  namespace: integration-test
spec:
  serviceAccountName: initcontainer-secret-create
  containers:
  - name: this-would-be-trivy
    image: ubuntu
    command: ["sleep", "9999"]
  initContainers:
  - name: init-container-test-container
    image: $1
    command: ["python"]
    args: ["secret_extraction.py", "fake-registry.xyz/ubuntu:32131", "test-secret", "default"]
    volumeMounts:
    - name: regcred-volume
      mountPath: "/secrets/regcred"
    env:
      - name: POD_NAME
        valueFrom:
          fieldRef:
            fieldPath: metadata.name
      - name: NAMESPACE
        valueFrom:
          fieldRef:
            fieldPath: metadata.namespace

  imagePullSecrets:
  - name: regcred
  volumes:
  - name: regcred-volume
    secret:
      secretName: regcred

---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: secret-create
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["create"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get"]
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: secret-create
subjects:
- kind: ServiceAccount
  name: initcontainer-secret-create
  namespace: integration-test
roleRef:
  kind: ClusterRole
  name: secret-create
  apiGroup: rbac.authorization.k8s.io

EOF
