#!/usr/bin/env bash

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

#
# Install the Minikube setup in the all-in-one Vagrant box.
#
# IMPORTANT: This script must be executed as root.
#

set -eu

export DEBIAN_FRONTEND="noninteractive"
MINIKUBE_DEB_FILE="minikube_latest_amd64.deb"
MINIKUBE_DEB_PATH="${HOME}/${MINIKUBE_DEB_FILE}"

cleanup() {
  rm -rfv "${MINIKUBE_DEB_PATH}"
}

# Cleanup stuff on normal exit and interuption.
trap cleanup EXIT
trap cleanup INT

update_system() {
  apt-get update
  apt-get upgrade -y
  apt-get install -y \
    apt-transport-https \
    ca-certificates \
    gnupg2 \
    curl \
    software-properties-common
}

# Install Docker as minikube provider (https://docs.docker.com/engine/install/debian/)
add_docker_apt_source() {
  add_apt_key "https://download.docker.com/linux/debian/gpg"
  add_apt_source "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable" "docker"
}

# Install kubectl (https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-using-native-package-management)
add_kubectl_apt_source() {
  add_apt_key "https://packages.cloud.google.com/apt/doc/apt-key.gpg"
  add_apt_source "deb https://apt.kubernetes.io/ kubernetes-xenial main" "kubernetes"
}

# https://helm.sh/docs/intro/install/
add_helm_apt_source() {
  add_apt_key "https://baltocdn.com/helm/signing.asc"
  add_apt_source "deb https://baltocdn.com/helm/stable/debian/ all main" "helm"
}

add_apt_key() {
  local url="${1}"
  curl -fsSL "${url}" | apt-key add -
}

add_apt_source() {
  local src="${1}"
  local destination="${2}"
  echo "${src}" >"/etc/apt/sources.list.d/${destination}.list"
}

# Install minikube (https://minikube.sigs.k8s.io/docs/start/)
download_and_install_minikube() {
  curl -sSLo "${MINIKUBE_DEB_PATH}" "https://storage.googleapis.com/minikube/releases/latest/${MINIKUBE_DEB_FILE}"
  dpkg -i "${MINIKUBE_DEB_PATH}"
}

update_system
add_docker_apt_source
add_kubectl_apt_source
add_helm_apt_source

apt-get -y update
apt-get install -y \
  docker-ce \
  kubectl \
  helm

download_and_install_minikube

systemctl start docker
usermod -a -G docker vagrant
