[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub release](https://img.shields.io/github/release/secureCodeBox/secureCodeBox.svg)](https://github.com/secureCodeBox/secureCodeBox/releases/latest)

# Continuous Secure Delivery - Out of the Box

![secureCodeBox](docs/resources/logo.png "secureCodeBox")

> _secureCodeBox_ is a docker based, modularized toolchain for continuous security scans of your software project. Its goal is to orchestrate and easily automate a bunch of security-testing tools out of the box.

## Overview

<!-- toc -->
- [Purpose of this Project](#purpose-of-this-project)
- [Quickstart](#quickstart)
- [How Does it Work?](#how-does-it-work)
- [Architecture](#architecture)
- [Roadmap](#roadmap)

For additional documentation aspects please have a look at our:
- [User Guide](docs/user-guide/README.md)
- [Developer Guide](docs/developer-guide/README.md)

<!-- tocstop -->

## Purpose of this Project

The typical way to ensure application security is to hire a security specialist (aka penetration tester) at some point in your project to check the application for security bugs and vulnerabilities. Usually, this check is done at a later stage of the project and has two major drawbacks:

1. Nowadays, a lot of projects do continuous delivery, which means the developers deploy new versions multiple times each day. The penetration tester is only able to check a single snapshot, but some further commits could introduce new security issues. To ensure ongoing application security, the penetration tester should also continuously test the application. Unfortunately, such an approach is rarely financially feasible.
2. Due to a typically time boxed analysis, the penetration tester has to focus on trivial security issues (low-hangig fruits) and therefore will not address the serious, non-obvious ones.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The purpose of *secureCodeBox* **is not** to replace the penetration testers or make them obsolete. We strongly recommend to run extensive tests by experienced penetration testers on all your applications.

![Overview of the architecture.](docs/resources/macbook_kibana.jpg "Overview of the architecture.")


**Important note**: The _secureCodeBox_ is no simple one-button-click-solution! You must have a deep understanding of security and how to configure the scanners. Furthermore, an understanding of the scan results and how to interpret them is also necessary.

There is a german article about [Security DevOps – Angreifern (immer) einen Schritt voraus][secdevops-objspec] in the software engineering journal [OBJEKTSpektrum][objspec].

## Quickstart

### Prerequisites
 * Minimal Docker version 18.03.0 is required
 * Docker-Compose is required.
 * Your docker host will need at least 4GB virtual memory to run the complete stack. If you want to scale out the scanner you will need more...

For a quick start checkout this repository and start the complete secureCodeBox stack with docker-compose:

```bash
git clone https://github.com/secureCodeBox/secureCodeBox
cd secureCodeBox
```

### Start with docker-compose
The docker-compose.yml file can be used to launch a secureCodeBox instance.
To start the secureCodeBox and some demo targets run the following:

```bash
docker-compose -f docker-compose.yml -f docker-compose.demo.yml up
```

Running `docker-compose up` uses the default credentials specified in the [`.env`](https://github.com/secureCodeBox/starter/blob/master/.env) file. You can override these by changing the file or setting the environment variables on your system. Before running the SecureCodeBox outside a testing environment you should at least change the following variables:
 * `CAMUNDADB_ROOT_PW` MySQL root password
 * `CAMUNDADB_USER` MySQL username used by the Camunda Engine
 * `CAMUNDADB_PW` MySQL password also used by the Camunda Engine
 * `ENGINE_SCANNERSERVICES_USER` Technical user for the scanner services to access the engines API
 * `ENGINE_SCANNERSERVICES_PASSWORD` Technical users password for the scanner services to access the engines API

### Run your first security scan
There are several ways to start a security scan with the secureCodeBox. One way is to use the WebUI of the engine and start the scan manually.

Access the WebUI via:
[http://your-docker-host:8080/](http://localhost:8080)

1. Create a local user account
2. Click on the user name -> my profile
3. Open the "Tasklist"
4. Click on "start process" in the upper menu
5. Select one of the implemented scan processes (e.g. NMAP)
6. Configure the scanner and hit "complete" / "start" (depending on the process)
7. Wait for the result and have fun

> **Hint**: If you wan't to use ZAP you might should increase the spider depth from 1 to minimum 3 (advanced configuration). If you use Arachni increase DOM depth, path depth and page limit (scan scope).

## How Does it Work?

The core of the _secureCodeBox_ is a [process engine][scb-engine] (based on the [Camunda][camunda] [BPMN][bpmn] plattform), which allows the user to define the whole scan process. The following image shows an example of a scan process:

![An example scan process.](docs/resources/scan_process.png "An example scan process.")

The scan itself may be triggered via the WebUI, a REST-API call or via webhooks. The system allows continuous integration software such as Jenkins, Travis CI, Bamboo etc. to trigger a scan automatically. The scans will be executed by the specified scanners and the results will be aggregated for review in the control center or the CI environment. For a more detailed description of the components and how they interact see the [architecture](#architecture) section.

## Architecture

The base architecture is a [Docker][docker] based [Microservices Architecture][microservices] as shown in the picture below.

![Overview of the architecture.](docs/resources/architecture_overview.png "Overview of the architecture.")

### Design Goal

The most important goal of the architecture is to build the whole toolchain highly modularized, extensible, and scalable. Therefore, we decided to provision the various parts in a microservice architecture style combined with [Docker][docker] as infrastructure. This design enables the extension of new components by adding a new container as an independent microservice and integrating it with the core engine via a well defined REST interface.

### Components

#### Process Engine – the Core

The main component of the _secureCodeBox_ is the [Camunda][camunda] [BPMN][bpmn] [engine][scb-engine], which allows the engineer to build the whole scan process as a [BPMN][bpmn] model. This component also provides the main web UI: The _secureCodeBox_ control center. In this UI you can see the available scan process definitions as [BPMN][bpmn] diagrams, start them (Tasklist), and manually review the results. Furthermore, the core is able to listen on webhooks and integrate the exposed process API. This provides the capability to trigger the scan processes by a continuous integration component, such as [Jenkins][jenkins] in our example, or any other continuous integration component capable of dealing with webhooks.

#### Scanners

The scanners are individual tools like [Nmap][nmap], [Nikto][nikto], [Arachni][arachni] and such. Every scanner tool runs in its own [Docker][docker] container. This has two main reasons:

1. You can easily add and integrate a new tool as a scanner, based on a language or technology of your choice, given that it can run inside [Docker][docker].
2. You can scale up the numbers of running scanners for massive parallel scanning

Each scanner requires a small adapter, usually written in Java, Ruby, Python, or JavaScript. The adapter fulfills two needs. Firstly it translates the configuration data, defining what to do, from the engine format into a usable format for the particular scanning tool. Secondly, it transforms the results of the scan into a usable format by the data collection component.

The scanners also have to check whether the engine has a job to fulfill using the  [external service task pattern][exteralServiceTask]. Requests from scanners were chosen over pushes from the engine due to an easier and more fail tolerant implementation. Otherwise the engine had to monitor the current progress of each scanner instance and whether it is still alive. Thanks to the current implementation a scanner might die and just sends a request after a restart.

The following scanners are currently available out of the box:

- [Nmap][nmap] for IP and port scans
- [Nikto][nikto] for web server scans
- [SSLyze][sslyze] for SSL/TLS scans
- [Arachni][arachni] web vulnerability scans
- [Amass][amass] for subdomain scans

In the works (coming soon)
- [SQLMap][sqlmap] for SQL Injection scans
- [WPScan][wpscan] black box [WordPress][wordpress] vulnerability scans
- [SSH Scan][sshscan] checking ssh servers for known vulnarabilities

Enabled by the architecture you can also add your own non-free or commercial tools, like
- [Burp Suite][burp] web vulnerability scanner.

#### Data Collection

The scanner results are collected by an ELK stack ([Elasticsearch][elasticsearch], [Kibana][kibana], and [Logstash][logstash]).

#### Example Targets

For demonstration purposes, we added some example targets to scan:

- [Damn Vulnerable Web Application][dvwa]
- [BodgeIT Store][bodgeit]
- [Juice Shop][juiceshop]

## FAQ

### Elasticsearch container fails to start: "max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]"

On the host machine run `sysctl -w vm.max_map_count=262144` as root. To make the change persistent add the line `vm.max_map_count=262144` to `/etc/sysctl.conf`.

### Scan-Container can't access outside of secure-code-box containers on CentOS

While it is possible to access for example the camunda engine from outside, it is not possible to perform scans outside of SecureCodeBox containers. _firewalld_ blocks traffic from containers to outside, please configure _firewalld_.


## Roadmap

At the moment, the _secureCodeBox_ is in a stable *beta state*. We are working hard on polishing, documenting and integrating new security scanners.

## License
Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

## Community
You are welcome, please join us on... 👋
- [GitHub][scb-github]
- [Slack][scb-slack]
- [Twitter][scb-twitter]

SecureCodeBox is an official [OWASP][owasp] project.

## Contributing
Contributions are welcome and extremely helpful 🙌

Author Information
------------------

Sponsored by [iteratec GmbH](https://www.iteratec.de/) - 
[secureCodeBox.io](https://www.securecodebox.io/)

[nginx]:                https://nginx.org/en/
[camunda]:              https://camunda.com/de/
[exteralServiceTask]:   https://docs.camunda.org/manual/latest/user-guide/process-engine/external-tasks/
[bpmn]:                 https://en.wikipedia.org/wiki/Business_Process_Model_and_Notation
[docker]:               https://www.docker.com/
[consul]:               https://www.consul.io/
[microservices]:        https://martinfowler.com/articles/microservices.html
[beta-testers]:         https://www.securecodebox.io/
[owasp]:                https://www.owasp.org/index.php/OWASP_secureCodeBox
[objspec]:              https://www.sigs-datacom.de/fachzeitschriften/objektspektrum.html
[secdevops-objspec]:    http://www.sigs.de/public/ots/2017/OTS_DevOps_2017/Seedorff_Pfaender_OTS_%20DevOps_2017.pdf
[jenkins]:              https://jenkins.io/
[nmap]:                 https://nmap.org/
[nikto]:                https://cirt.net/Nikto2
[arcachni]:             http://www.arachni-scanner.com/
[sslyze]:               https://github.com/nabla-c0d3/sslyze
[sqlmap]:               http://sqlmap.org/
[sshscan]:              https://github.com/mozilla/ssh_scan_api
[burp]:                 https://portswigger.net/burp
[arachni]:              http://www.arachni-scanner.com/
[wpscan]:               https://wpscan.org/
[amass]:                https://github.com/owasp/amass
[wordpress]:            https://wordpress.com/
[consul]:               https://www.consul.io/
[resty]:                https://openresty.org/en/
[keycloak]:             http://www.keycloak.org/
[openid]:               https://de.wikipedia.org/wiki/OpenID
[elasticsearch]:        https://www.elastic.co/products/elasticsearch
[kibana]:               https://www.elastic.co/de/products/kibana
[logstash]:             https://www.elastic.co/products/logstash
[dvwa]:                 http://www.dvwa.co.uk/
[bodgeit]:              https://github.com/psiinon/bodgeit
[juiceshop]:            https://www.owasp.org/index.php/OWASP_Juice_Shop_Project

[scb-github]:           https://github.com/secureCodeBox/
[scb-engine]:           https://github.com/secureCodeBox/engine
[scb-twitter]:          https://twitter.com/secureCodeBox
[scb-slack]:            https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTJiNzg3MmU2ZDY2NDFiMGI0Y2FkM2I5Mzc2ZmEzYTcyN2FlN2Y2NDFiZDE5NjAxMjg1M2IxNDViNzE3OTIxMGU
[scb-license]:          https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE    
