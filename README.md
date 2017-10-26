# secureCodeBox – Continuous Secure Delivery Out of the Box

![secureCodeBox](img/logo.png "secureCodeBox")

> _secureCodeBox_ is a docker based, modularized toolchain for continuous security scans of your software project.

## Table of contents

<!-- toc -->
- [Purpose of this Project](#purpose-of-this-project)
- [How does it Works](#how-does-it-works)
- [Roadmap](#roadmap)
- [Architecture](#architecture)
<!-- tocstop -->

## Purpose of this Project

The typical way to ensure application security is to hire a security specialist (aka. penetration tester) at some point in your project to check the application for security bugs and vulnerabilities. Usually this happens very late in the project and has various drawbacks:

1. Nowadays a lot of projects do continuous delivery, which means multiple deployments a day. The penetration tester can only check a single snapshot of these deployments. But some commits later there may be new security issues introduced. So in consequence a penetration tester should also continuously check the application. But this is not affordable.
2. In the typically time boxed analysis, the penetration tester may be engaged in finding trivial security issues (low hanging fruits) and thus will not even reach the serious, non obvious ones.

With the _secureCodeBox_ we provide a toolchain to/for continuously scan/ning applications to find the low-hanging fruit issues in the development process. So that a penetration tester can concentrate on the major security issues.

It **is not** the purpose of *secureCodeBox* to make penetration testers obsolete. We strongly recommend letting your application be check by one!

There is a german article about [Security DevOps – Angreifern (immer) einen Schritt voraus][secdevops-objspec] in the software engineering journal [OBJEKTSpektrum][objspec].

## How does it Works

The core of the _secureCodeBox_ is the control center (a web UI). With this the whole scan process is defined. An example process is shown in the image below.

![An example scan process.](img/scan_process.png "An example scan process.")

The scan itself may be triggered via the control center or via web hooks. The web hooks gives the possibility for a scan to be triggered by a CI such as Jenkins, Travis CI, Bamboo or such. The scan itself will be handed over to the scanners and the results will be aggregated for review in the control center or the CI environment. For a detailed description of the components and how they work together see the [architecture](#architecture) section.

**Important note**: The _secureCodeBox_ is no simple one button click solution! You must have a deep understanding of security and how to configure the scanners. Also it is necessary that you understand the results of of the scans and how to interpret them.

## Roadmap

At the moment the _secureCodeBox_ is in a stable beta state. You can register as a beta tester [here][beta-testers]. We are hard working on polishing and documenting so that we can push all sources here on GitHub until the end of 2017. Also we want to become an official [OWASP][owasp] project.

## Architecture

The base architecture is a [Docker][docker] based [Microservices architecture][microservices] as shown in the picture below.

![Overview of the architecture.](img/architecture_overview.png "Overview of the architecture.")

### Design Goal

The most important goal of the architecture is to build the whole toolchain highly modularized, extensible, and scalable. So we decided to orchestrate the various parts (described later on) with [Docker][docker]. As frontend to the user we use [NginX][nginx] which serves as a proxy in front of all services which provide a web UI. This design gives us the possibility to add new components very easily by adding a new containers and integrating it.

### Components

#### Process Engine – the Core

The main component of the _secureCodeBox_ is the [Camunda][camunda] [BPMN][bpmn] engine. It is used to build the whole scan process as a [BPMN][bpmn] model. This component also provides the main web UI: The _secureCodeBox_ control center. In this UI you can see the available scan process definitions as [BPMN][bpmn] diagrams, start them, and see the results for manual review. This component also provides the possibility to listen on web hooks. This allows us to trigger the scan processes by a continuous integration component ([Jenkins][jenkins] in our example or any other which can deal with web hooks).

#### Single Sign On

TODO

#### Scanners

The scanners are individual tools such as [nmap][nmap], [Nikto][nikto], [Arcachni][arcachni] and such. Every scanner tool lives in it's own [Docker][docker] container. This has two main reasons:

1. you can easily add a new tool as scanner, if it can run inside [Docker][docker]
1. you can scale up the numbers of running scanners for massive parallel scanning

Each scanner needs a small adapter (usually a Ruby script) which translates the data from the engine with the information what to do into a format usable by the particular tool, and transform the results of the tool into a format usable by the data collection component.

Also the scanners are responsible to poll the engine to check if something needs to be done. The reason for polling instead of pushing the scan orders from the engine to scanners is easier and more fail tolerant implementation: If we do push notifications to the scanners, then the engine must maintain which scanner instance is running or idle. Also it must recognize if a scanner dies. With polling a scanner may die and after restarting it just starts polling for work.

Currently we have severals scanners available out of the box:

- [Nmap][nmap] for IP and port scans
- [Nikto][nikto] for web server scans
- [SSLyze][sslyze] for SSL/TLS scans
- [SQLMap][sqlmap] for SQL injection scans
- [Burp Suite][burp] web vulnerability scans
- [Arachni][arachni] web vulnerability scans
- [WPScan][wpscan] black box [WordPress][wordpress] vulnerability scans

But our architecture let you also add your own non-free or commercial tools.

#### Data Collection

The collection of the scanner results is done by an ELK stack ([Elasticsearch][elasticsearch], 
[Kibana][kibana], and [Logstash][logstash]).

#### Example Targets

For demonstration purpose we added some example targets to scan:

- [Damn Vulnerable Web Application][dvwa]
- [BodgeIT Store][bodgeit]
- [Juice Shop][juiceshop]

[camunda]:              https://camunda.com/de/
[bpmn]:                 https://en.wikipedia.org/wiki/Business_Process_Model_and_Notation
[docker]:               https://www.docker.com/
[microservices]:        https://martinfowler.com/articles/microservices.html
[beta-testers]:         https://www.securecodebox.io/
[owasp]:                https://www.owasp.org/index.php/Main_Page
[objspec]:              https://www.sigs-datacom.de/fachzeitschriften/objektspektrum.html
[secdevops-objspec]:    http://www.sigs.de/public/ots/2017/OTS_DevOps_2017/Seedorff_Pfaender_OTS_%20DevOps_2017.pdf
[jenkins]:              https://jenkins.io/
[nmap]:                 https://nmap.org/
[nikto]:                https://cirt.net/Nikto2
[arcachni]:             http://www.arachni-scanner.com/
[sslyze]:               https://github.com/nabla-c0d3/sslyze
[sqlmap]:               http://sqlmap.org/
[burp]:                 https://portswigger.net/burp
[wpscan]:               https://wpscan.org/
[wordpress]:            https://wordpress.com/
[consul]:               https://www.consul.io/
[elasticsearch]:        https://www.elastic.co/products/elasticsearch
[kibana]:               https://www.elastic.co/de/products/kibana
[logstash]:             https://www.elastic.co/products/logstash
[dvwa]:                 http://www.dvwa.co.uk/
[bodgeit]:              https://github.com/psiinon/bodgeit
[juiceshop]:            https://www.owasp.org/index.php/OWASP_Juice_Shop_Project
