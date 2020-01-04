#!/usr/bin/env bash

kubectl create namespace monitoring

echo "Installing prometheus-operator"
helm --namespace monitoring upgrade --install prometheus stable/prometheus-operator --version 8.3.3 --values monitoring.yaml

echo "Installing loki"
helm --namespace monitoring upgrade --install loki loki/loki --version 0.22.0 --set="serviceMonitor.enabled=true"
echo "Installing loki/promtail"
helm --namespace monitoring upgrade --install promtail loki/promtail --version 0.16.0 --set "loki.serviceName=loki" --set="serviceMonitor.enabled=true"