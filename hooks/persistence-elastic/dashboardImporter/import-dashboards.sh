# SPDX-FileCopyrightText: 2020 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

 #!/usr/bin/env bash

kibanaURL=${KIBANA_URL:-"http://localhost:5601"}

echo "Waiting until kibana becomes availible"
until $(curl --output /dev/null --silent --head --fail ${kibanaURL}); do
    printf '.'
    sleep 5
done
echo ""
echo "Kibana is availible"

for filename in ./dashboards/*.json; do
    echo "Importing dashboard '${filename}'"
    curl -i -H "Content-Type: application/json" -H "kbn-xsrf: reporting" -X POST --data @${filename} ${kibanaURL}/api/kibana/dashboards/import
    echo -e "\n\n"
done
