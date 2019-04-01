# Configuring Persistence Providers

## Setting the Persistence Provider

The engine supports multiple different persistence providers. Each of the prepackaged persistence providers can be toggle on by using environment variables.

The currently availible persistence providers are:

| Name          | Environment Variable                              | Default Value |
| ------------- | ------------------------------------------------- | ------------- |
| Elasticsearch | `SECURECODEBOX_PERSISTENCE_ELASTICSEARCH_ENABLED` | `"false"`     |
| DefectDojo    | `SECURECODEBOX_PERSISTENCE_DEFECTDOJO_ENABLED`    | `"false"`     |
| S3            | `SECURECODEBOX_PERSISTENCE_S3_ENABLED`            | `"false"`     |
| None          | `SECURECODEBOX_PERSISTENCE_NONE_ENABLED`          | `"false"`     |

To activate the persistence providers the `enabled` variable must be set to `"true"`.

> **Note**: Most PersistenceProviders require additional configuration to set the location and access credentials. These are documented in the sections for the individual persistence providers below.

The corresponding PersistenceProvider-implementation class must have a matching `@ConditionalOnProperty` annotation, e.g. `@ConditionalOnProperty(name = "securecodebox.persistence.elasticsearch.enabled", havingValue = "true")` for Elasticsearch.

## Specific Settings

### Elasticsearch Persistence Provider

The ElasticSearch PersistenceProvider saves all findings and reports into the configured ElasticSearch index. This allows for some easy searching and visualisation of the findings.

#### Enabling Elasticsearch as Persistence Provider

To use Elasticsearch for persistence set `securecodebox.persistence.elasticsearch.enabled` or the corresponding environment variable to `"true"`.

#### Properties / Environment Variables

| Property                                             | Example Value | Mandatory |
| ---------------------------------------------------- | ------------- | --------- |
| securecodebox.persistence.elasticsearch.host         | elasticsearch | yes       |
| securecodebox.persistence.elasticsearch.port         | 9200          | yes       |
| securecodebox.persistence.elasticsearch.index.prefix | securecodebox | yes       |

Alternatively the corresponding environment variables, e.g. `SECURECODEBOX_PERSISTENCE_ELASTICSEARCH_HOST` can be used.

### DefectDojo Persistence Provider

DefectDojo is a OpenSource Tools for importing and managing findings of security scanners. The DefectDojo Persistence Provider can be used to create new Engagment for SecurityTest run via the secureCodeBox and import all findings which were identified.

Tools which are supported by the secureCodeBox and DefectDojo (OWASP ZAP, Arachni & Nmap) this is done by importing the raw scan report into DefectDojo. Findings by other secureCodeBox supported scanners are currently not directly supported by DefectDojo. These findings are improted via a generic finding api of defectdojo, which might cause some loss of imformation about the findings.

#### Enabling DefectDojo as Persistence Provider

To use DefectDojo for persistence set `securecodebox.persistence.defectdojo.enabled` or the corresponding environment variable to `"true"`.

#### Properties / Environment Variables

| Property                                       | Example Value                            | Mandatory |
| ---------------------------------------------- | ---------------------------------------- | --------- |
| securecodebox.persistence.defectdojo.url       | http://localhost:8000                    | yes       |
| securecodebox.persistence.defectdojo.auth.key  | 7fd7eac6fed567b19928f7928a7ddb86f0497e4e | yes       |
| securecodebox.persistence.defectdojo.auth.name | admin                                    | yes       |

Alternatively the corresponding environment variables, e.g. `SECURECODEBOX_PERSISTENCE_DEFECTDOJO_URL` can be used.

#### Runetime Security Test Config

The DefectDjojo Persistence Provider requries some additional configuration for every securityTest.
This configuration has only one **mandatory** parameter, which is the **context** of the security scan. This has to be the same as the product name inside DefectDojo related to the scan. Once the scan is finished a new engagment for the product and all findings are getting imported.

Other than the context, there are also a number of optional params, which are used to populate other fields of the DefectDojo engagment.
These can be set by passing them in the `metaData` param of the securityTest.

| Meta Field             |  Description                                                                                         | Example Value                     | Mandatory |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------- | --------- |
| `DEFECT_DOJO_USER`     | Username of the DefectDojo user responsible for the scan. Defaults to username of the technical user | john_doe                          | no        |
| `SCB_BRANCH`           | Tag or branch of the product the engagement tested                                                   | develop                           | no        |
| `SCB_BUILD_ID`         | Build ID of the product the engagement tested                                                        | 1.0                               | no        |
| `SCB_COMMIT_HASH`      | Commit hash from repo                                                                                | 9a03412                           | no        |
| `SCB_TRACKER`          | Link to epic or ticket system with changes to version                                                | http://your-ticket-system.com     | no        |
| `SCB_REPO`             | Repository                                                                                           | http://your-remote-repository.com | no        |
| `SCB_BUILD_SERVER`     | Build server responsible for CI/CD test                                                              | http://your-build-server.com      | no        |
| `SCB_SCM_SERVER`       | Source code server for CI/CD test                                                                    | http://your-scm-server.com        | no        |
| `SCB_ENGAGEMENT_TITLE` | Title for the engagement. Defaults to name of the supported scanner or "Generic Findings Import"     | Engagement No.1337                | no        |

An example security test with these values set would look like this:

```json
[
  {
    "name": "nmap",
    "context": "product-1",
    "target": {
      "name": "Test Server",
      "location": "10.11.11.11",
      "attributes": {
        "NMAP_PARAMETER": "-Pn"
      }
    },
    "metaData": {
      "DEFECT_DOJO_USER": "john_doe",
      "SCB_BRANCH": "develop",
      "SCB_BUILD_ID": "1.0",
      "SCB_COMMIT_HASH": "9a03412",
      "SCB_TRACKER": "http://your-ticket-system.com",
      "SCB_REPO": "http://your-remote-repository.com",
      "SCB_BUILD_SERVER": "http://your-build-server.com",
      "SCB_SCM_SERVER": "http://your-scm-server.com",
      "SCB_ENGAGEMENT_TITLE": "Engagement No.1337"
    }
  }
]
```

### None Persistence Provider

The none persistence provider is mostly used for testing puposes. It doesn't save the results anywhere, it just logs that has been called.
