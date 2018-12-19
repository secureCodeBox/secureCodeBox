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
This configuration is to set additional information e.g. for which product should engagment and findings be created?

| Meta Field            |  Description                                                                                         | Example Value | Mandatory |
| --------------------- | ---------------------------------------------------------------------------------------------------- | ------------- | --------- |
| `DEFECT_DOJO_PRODUCT` | ProductId of the DefectDojo product the results should be attached on                                | 42            | yes       |
| `DEFECT_DOJO_USER`    | Username of the DefectDojo user responsible for the scan. Defaults to username of the technical user | john_doe      | no        |

### None Persistence Provider

The none persistence provider is mostly used for testing puposes. It doesn't save the results anywhere, it just logs that has been called.
