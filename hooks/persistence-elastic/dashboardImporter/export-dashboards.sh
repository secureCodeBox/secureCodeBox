#!/usr/bin/env bash

# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

kibanaURL=${1:-"http://localhost:5601"}

exportDashboard() {
  local filename=$1
  local id=$2
  curl ${kibanaURL}/api/kibana/dashboards/export?dashboard=${id} > ./dashboards/${filename}
}

exportDashboard "daily-summary.json" "34c734b0-6e79-11ea-bdc0-35f8aa7c4664"
exportDashboard "wordpress-overview.json" "12b72880-fc09-11ea-a91c-5358dd402fdc"
exportDashboard "subdomain-overview.json" "83e56080-b235-11ea-872e-c9b5d5ddb284"
exportDashboard "tls-ssl-overview.json" "f5e576c0-af97-11ea-b237-7b9069d086af"
exportDashboard "zap-overview.json" "57b2a830-bc60-11ea-872e-c9b5d5ddb284"
exportDashboard "nikto-overview.json" "6a005c80-c4fd-11ea-8ad8-4f602085b3a0"
exportDashboard "portscan-overview.json" "d93db110-937f-11ea-9a99-c571feec3570"
exportDashboard "ssh-overview.json" "271ddac0-98d7-11ea-890b-7db8819c4f5b"
