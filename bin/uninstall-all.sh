#!/usr/bin/env bash

set -eu

helm -n securecodebox-system uninstall securecodebox-operator

helm uninstall amass
helm uninstall kube-hunter
helm uninstall nikto
helm uninstall nmap
helm uninstall ssh-scan
helm uninstall sslyze
helm uninstall trivy
helm uninstall zap
helm uninstall wpscan

helm uninstall dummy-ssh
helm uninstall bodgeit
helm uninstall http-webhook
helm uninstall juice-shop
helm uninstall old-wordpress
helm uninstall swagger-petstore

helm uninstall aah
helm uninstall gwh
helm uninstall issh

helm uninstall elkh

kubectl delete namespaces securecodebox-system
