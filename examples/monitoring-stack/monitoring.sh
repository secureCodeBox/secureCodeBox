#!/usr/bin/env bash

kubectl create namespace monitoring

echo "Installing prometheus-operator"
helm --namespace monitoring upgrade --install prometheus stable/prometheus-operator --version 8.3.3 --values ./examples/monitoring-stack/monitoring.yaml

echo "Installing loki"
helm --namespace monitoring upgrade --install loki loki/loki --version 0.22.0 --set="serviceMonitor.enabled=true"
echo "Installing loki/promtail"
helm --namespace monitoring upgrade --install promtail loki/promtail --version 0.16.0 --set "loki.serviceName=loki" --set="serviceMonitor.enabled=true"

echo "Installing secureCodeBox Stack"

# This will deploy a redis cluster and a minio deployment alongside the engine deployment.
# You can disable the creation to use services like a hosted Redis solution and AWS S3, DigitalOcean Spaces or another compatible Solution.
helm upgrade --install engine ./engine/

# Dispatcher Deployment
helm upgrade --install dispatcher ./dispatcher/ --set "dispatcherEnvironmentName=$(kubectl config current-context)" --set "metrics.enabled=true" --set "metrics.serviceMonitor.enabled=true" --set "lurcherMetrics=true" --set "prometheus-pushgateway.enabled=true"

# Deploy nmap, amass and ssh_scan ScanJob and ParseJob Definition
kubectl apply -f integrations/nmap/nmap-scanjob-definition.yaml -f integrations/nmap/nmap-parsejob-definition.yaml
kubectl apply -f integrations/amass/amass-scanjob-definition.yaml -f integrations/amass/amass-parsejob-definition.yaml
kubectl apply -f integrations/ssh_scan/ssh-scan-scanjob-definition.yaml -f integrations/ssh_scan/ssh-scan-parsejob-definition.yaml
kubectl apply -f integrations/zap/zap-scanjob-definitions.yaml -f integrations/zap/zap-parsejob-definition.yaml