# Configuring Persistence Providers

## Setting the Persistence Provider
The persistence provider can be set using the environment variable `SECURECODEBOX_PERSISTENCE_PROVIDER` or the property `securecodebox.persistence.provider` in a properties file.

By default `elasticsearch` and `none` are supported.

> **Note**: More details on Spring Boot's naming scheme for properties can be found [here](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-external-config.html#boot-features-external-config-relaxed-binding).

The corresponding PersistenceProvider-implementation class must have a matching `@ConditionalOnProperty` annotation, e.g. `@ConditionalOnProperty(name = "securecodebox.persistence.provider", havingValue = "elasticsearch")` for Elasticsearch. 

## Specific Settings
### Elasticsearch
#### Setting Elasticsearch as Persistence Provider
To use Elasticsearch for persistence set `securecodebox.persistence.provider` or the corresponding environment variable to `elasticsearch`.

#### Properties / Environment Variables
| Property                                             | Example Value |
| ---------------------------------------------------- | ------------- |
| securecodebox.persistence.elasticsearch.host         | elasticsearch |
| securecodebox.persistence.elasticsearch.port         | 9200          |
| securecodebox.persistence.elasticsearch.index.prefix | securecodebox |

Alternatively the corresponding environment variables, e.g. `SECURECODEBOX_PERSISTENCE_ELASTICSEARCH_HOST` can be used.