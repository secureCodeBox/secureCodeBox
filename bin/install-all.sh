#!/usr/bin/env bash

set -eu

kubectl create namespace securecodebox-system
helm -n securecodebox-system upgrade --install securecodebox-operator ./operator/

helm upgrade --install amass ./scanners/amass/
helm upgrade --install kube-hunter ./scanners/kube-hunter/
helm upgrade --install nikto ./scanners/nikto
helm upgrade --install nmap ./scanners/nmap/
helm upgrade --install ssh-scan ./scanners/ssh_scan/
helm upgrade --install sslyze ./scanners/sslyze/
helm upgrade --install trivy ./scanners/trivy/
helm upgrade --install zap ./scanners/zap/
helm upgrade --install wpscan ./scanners/wpscan/

helm upgrade --install dummy-ssh ./demo-apps/dummy-ssh/
helm upgrade --install juice-shop ./demo-apps/juice-shop/
helm upgrade --install old-wordpress ./demo-apps/old-wordpress/
helm upgrade --install bodgeit ./demo-apps/bodgeit/
helm upgrade --install swagger-petstore ./demo-apps/swagger-petstore/
helm upgrade --install http-webhook ./demo-apps/http-webhook/

helm upgrade --install aah ./hooks/update-field/
helm upgrade --install gwh ./hooks/generic-webhook/
helm upgrade --install issh ./hooks/imperative-subsequent-scans/

helm upgrade --install elkh ./hooks/persistence-elastic/
