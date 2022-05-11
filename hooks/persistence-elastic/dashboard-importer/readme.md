<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->

# Dashboard Importer

Imports all standard secureCodeBox Dashboards to Kibana.
This comes pre-bundled as a kubernetes job in the Elastic Persistence Provider helm chart.

## Updating the Kibana Dashboards

If you made changes to the Kibana Dashboards which you want rolled out to everybody, you can update the dashboards in the [dashboards](./dashboards/) folder. To update the easily you can use the [export-dashboards](./export-dashboards.sh) bash script. If you added a new dashboard you'll need to update the script to create a mapping between filename and dashboard id.

```bash
# Default call. Assumes Kibana to be available at "http://localhost:5601"
./export-dashboards.sh

# With a custom kibana endpoint
./export-dashboards.sh "https://kibana.local.example.com"
```
