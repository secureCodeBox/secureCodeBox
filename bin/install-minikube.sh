#!/usr/bin/env bash

set -eu

export DEBIAN_FRONTEND="noninteractive"
apt-get update
apt-get upgrade -y
apt-get install -y \
  apt-transport-https \
  ca-certificates \
  gnupg2 \
  curl \
  software-properties-common

# Install Docker as minikube provider (https://docs.docker.com/engine/install/debian/)
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
apt-get -y update
apt-get install -y docker-ce
systemctl start docker
usermod -a -G docker vagrant

# Install minikube (https://minikube.sigs.k8s.io/docs/start/)
curl -sSLO https://storage.googleapis.com/minikube/releases/latest/minikube_latest_amd64.deb
dpkg -i minikube_latest_amd64.deb
rm minikube_latest_amd64.deb

# Install kubectl (https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-using-native-package-management)
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" > /etc/apt/sources.list.d/kubernetes.list
apt-get update
apt-get install -y kubectl
