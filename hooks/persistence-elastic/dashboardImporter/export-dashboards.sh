#!/usr/bin/env bash

kibanaURL=${1:-"http://localhost:5601"}

exportDashboard() {
  local filename=$1
  local id=$2
  curl ${kibanaURL}/api/kibana/dashboards/export?dashboard=${id} > ./dashboards/${filename}
}

exportDashboard "daily-summary.json" "34c734b0-6e79-11ea-bdc0-35f8aa7c4664"
exportDashboard "wordpress-overview.json" "12b72880-fc09-11ea-a91c-5358dd402fdc"
exportDashboard "subdomain-overview.json" "83e56080-b235-11ea-872e-c9b5d5ddb284"
