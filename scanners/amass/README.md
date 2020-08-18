---
title: "Amass"
path: "scanners/amass"
category: "scanner"
type: "Network"
state: "released"
appVersion: "3.9.1"
usecase: "Subdomain Enumeration Scanner"
---

![owasp logo](https://owasp.org/assets/images/logo.png)

The OWASP Amass Project has developed a tool to help information security professionals perform network mapping of attack surfaces and perform external asset discovery using open source information gathering and active reconnaissance techniques. To learn more about the Amass scanner itself visit [OWASP_Amass_Project] or [Amass GitHub].

<!-- end -->

## Configuration

The following security scan configuration example are based on the [Amass User Guide], please take a look at the original documentation for more configuration examples.

* The most basic use of the tool for subdomain enumeration: `amass enum -d example.com`
* Typical parameters for DNS enumeration: `amass enum -v -src -ip -brute -min-for-recursive 2 -d example.com`

Special command line options:

* Disable generation of altered names	`amass enum -noalts -d example.com`
* Turn off recursive brute forcing	`amass enum -brute -norecursive -d example.com`
* Disable saving data into a local database	`amass enum -nolocaldb -d example.com`
* Domain names separated by commas (can be used multiple times)	`amass enum -d example.com`

[OWASP_Amass_Project]: https://owasp.org/www-project-amass/
[Amass GitHub]: https://github.com/OWASP/Amass
[Amass User Guide]: https://github.com/OWASP/Amass/blob/master/doc/user_guide.md
