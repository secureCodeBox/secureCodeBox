<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->

# secureCodeBox Auto-Discovery

The Auto Discovery Services monitor security relevant resources inside a cloud environment and automatically create scans to continuously monitor security aspects of the resources. We aim to eventually support most mayor cloud providers, like AWS, GCP and Azure, but also runtime environments on top of these, primarily kubernetes.

## Example

A developer deploys an app to a kubernetes cluster where the secureCodeBox and the kubernetes cloud integration for the secureCodeBox is installed. They create an Deployment for their application container and a Ingress to expose the application to the world.

The kubernetes cloud integration service will automatically detect these new resources and start scans for them.
The scans it would start:

1. A image scan scanning for vulnerable libraries in the docker / container image of the deployment. (Using trivy)
2. A TLS scan against the certificate of the ingress for the host. (Using SSLyze)
3. A ZAP scan to detect basic web vulnerabilities in the service. (Using OWASP ZAP)
