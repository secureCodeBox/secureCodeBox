#!/usr/bin/env bash

set -eu

helm -n securecodebox-system uninstall securecodebox-operator || true

helm uninstall amass || true
helm uninstall kube-hunter || true
helm uninstall nikto || true
helm uninstall nmap || true
helm uninstall ssh-scan || true
helm uninstall sslyze || true
helm uninstall trivy || true
helm uninstall zap || true
helm uninstall wpscan || true

helm uninstall dummy-ssh || true
helm uninstall bodgeit || true
helm uninstall http-webhook || true
helm uninstall juice-shop || true
helm uninstall old-wordpress || true
helm uninstall swagger-petstore || true

helm uninstall aah || true
helm uninstall gwh || true

helm uninstall elkh || true

kubectl delete namespaces securecodebox-system || true
