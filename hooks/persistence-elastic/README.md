---
title: "Elasticsearch"
path: "hooks/persistence-elastic"
category: "hook"
type: "persistenceProvider"
state: "released"
usecase: "Publishes all Scan Findings to elasticsearch (ECK)."
---

<!-- end -->

## About
The ElasticSearch persistenceProvider hook saves all findings and reports into the configured ElasticSearch index. This allows for some easy searching and visualization of the findings. To learn more about Elasticsearch visit elastic.io.

## Deployment

Installing the Elasticsearch persistenceProvider hook will add a _ReadOnly Hook_ to your namespace. 

```bash
helm upgrade --install elkh ./hooks/persistence-elastic/
```

## Configuration
see values.yaml

```yaml
# Define a specific index prefix
indexPrefix: "scbv2"

# Enable this when you already have an Elastic Stack running to which you want to send your results
externalElasticStack:
  enabled: false
  elasticsearchAddress: "https://elasticsearch.example.com"
  kibanaAddress: "https://kibana.example.com"

# Configure authentication schema and credentials the persistence provider should use to connect to elasticsearch
# user and apikey are mutually exclusive, only set one!
authentication:
  # Link a pre-existing generic secret with `username` and `password` key / value pairs
  userSecret: null
  # Link a pre-existing generic secret with `id` and `key` key / value pairs
  apiKeySecret: null

# Configures included Elasticsearch subchart
elasticsearch:
  enabled: true
  replicas: 1
  minimumMasterNodes: 1
  # image: docker.elastic.co/elasticsearch/elasticsearch-oss

# Configures included Elasticsearch subchart
kibana:
  enabled: true
  # image: docker.elastic.co/kibana/kibana-oss
```