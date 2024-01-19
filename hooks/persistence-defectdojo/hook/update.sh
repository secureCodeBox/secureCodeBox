#!/usr/bin/env bash
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# This script generates the model classes from a released version of cert-manager CRDs
# under src/main/java/io/cert/manager/models.

set -euo pipefail

DEFAULT_IMAGE_NAME="ghcr.io/kubernetes-client/java/crd-model-gen"
DEFAULT_IMAGE_TAG="v1.0.6"
IMAGE_NAME="${IMAGE_NAME:=$DEFAULT_IMAGE_NAME}"
IMAGE_TAG="${IMAGE_TAG:=$DEFAULT_IMAGE_TAG}"
CRD_URL="https://raw.githubusercontent.com/secureCodeBox/secureCodeBox/main/operator/crds/execution.securecodebox.io_scans.yaml"

# a crdgen container is run in a way that:
#   1. it has access to the docker daemon on the host so that it is able to create sibling container on the host
#   2. it runs on the host network so that it is able to communicate with the KinD cluster it launched on the host
docker run \
  --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$(pwd)":"$(pwd)" \
  --network host \
  "${IMAGE_NAME}:${IMAGE_TAG}" \
  /generate.sh \
  -u "${CRD_URL}" \
  -n io.securecodebox \
  -p io.securecodebox \
  -o "$(pwd)"
