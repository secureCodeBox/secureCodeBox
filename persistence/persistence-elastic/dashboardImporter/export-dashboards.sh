 #!/usr/bin/env bash

kibanaURL=${1:-"http://localhost:5601"}

exportDashboard() {
  local filename=$1
  local id=$2
  curl ${kibanaURL}/api/kibana/dashboards/export?dashboard=${id} > ./dashboards/${filename}
}

exportDashboard "daily-summary.json" "34c734b0-6e79-11ea-bdc0-35f8aa7c4664"