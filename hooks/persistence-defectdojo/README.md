---
title: "DefectDojo"
path: "hooks/persistence-defectdojo"
category: "hook"
type: "persistenceProvider"
state: "roadmap"
usecase: "Publishes all Scan Findings to elasticsearch (ECK)."
---

<!-- end -->

## About

DefectDojo is an OpenSource Tools for importing and managing findings of security scanner. The DefectDojo persistence provider can be used to create new Engagements for SecurityTests run via the secureCodeBox and import all findings which were identified.

Tools which are supported by the secureCodeBox and DefectDojo (OWASP ZAP, Arachni & Nmap) this is done by importing the raw scan report into DefectDojo. Findings by other secureCodeBox supported scanners are currently not directly supported by DefectDojo. These findings are imported via a generic finding api of defectDojo, which might cause some loss of information about the findings.  

To learn more about DefectDojo visit [DefectDojo GitHub] or [DefectDojo Website].

## Deployment
The secureCodeBox core team is working on an integration of DefectDojo. We will keep you informed.


[DefectDojo Website]: https://www.defectdojo.org/
[DefectDojo GitHub]: https://github.com/DefectDojo/django-DefectDojo
[DefectDojo Documentation]: https://defectdojo.readthedocs.io/en/latest/