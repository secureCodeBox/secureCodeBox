---
title: "DefectDojo"
category: "hook"
type: "persistenceProvider"
state: "developing"
usecase: "Publishes all Scan Findings to DefectDojo."
---

<!-- end -->

## About

DefectDojo is an open-source tool for importing and managing findings of security scanners. The DefectDojo persistence provider can be used to create new Engagements for SecurityTests run via the secureCodeBox and import all findings which were identified automatically to DefectDojo.

Tools which are supported both by the secureCodeBox and DefectDojo (OWASP ZAP & Nmap) this is done by importing the raw scan report into DefectDojo. Findings by other secureCodeBox supported scanners are currently not directly supported by DefectDojo. These findings are imported via a generic finding API of DefectDojo, which might cause some loss of information on the findings.  

To learn more about DefectDojo visit [DefectDojo GitHub] or [DefectDojo Website].

## Deployment
> 🔧 The implementation is currently work-in-progress and under still undergoing major changes. It'll be released here once it has stabilized.


[DefectDojo Website]: https://www.defectdojo.org/
[DefectDojo GitHub]: https://github.com/DefectDojo/django-DefectDojo
[DefectDojo Documentation]: https://defectdojo.readthedocs.io/en/latest/