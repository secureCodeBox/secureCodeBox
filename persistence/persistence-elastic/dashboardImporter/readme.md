# Dashboard Importer

Imports all standard secureCodeBox Dashboards to Kibana.
This comes pre-bundled as a kubernetes job. If you install the Elastic Persistence Provider via helm you will get this by default ;)

## Updating the Kibana Dashboards

If you made changes to the Kibana Dashboards which you want rolled out to everybody, you can update the dashboards in the [dashboards](./dashboards/) folder. To update the easily you can use the [export-dashboards](./export-dashboards.sh) bash script.

```bash
# Default call. Assumes Kibana to be available at "http://localhost:5601"
./export-dashboards.sh

# With a custom kibana endpoint
./export-dashboards.sh "https://kibana.local.example.com"
```
