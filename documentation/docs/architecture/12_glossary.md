---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Glossary"
sidebar_label: "Glossary"
sidebar_position: 12
---
# Glossary {#section-glossary}

_Charts_: Template files for [Helm][] to configure the deployment on [Kubernetes][k82].

_CI_: [Continuous Integration][wiki-Continuous-integration].

_Container_: Concept for [OS-level virtualization][wiki-container].

_Custom Resource Definition (CRD)_: This is a [concept from Kubernetes][k8s-custom-resources] to define custom resource types additionally to the provided ones from Kubernetes. 

_Hook_: A _hook_ is a concept in _secureCodeBox_ to give the opportunity to react on detected findings. _Hooks_ are invoked after parsing and storing the _Findings_. There are two kinds of _Hooks_: _ReadHooks_ and _ReadWriteHooks_. See the [_hooks_ documentation](/docs/hooks) for more details.

_Job_: A Job creates one or more Pods and will continue to retry execution of the Pods until a specified number of them successfully terminate. (see [official Kubernetes documentation][k82-job-doc].)

_Engine_: This is the central component of the _secureCodeBox_ which controls the business logic. It implements the _operator_ pattern. 

_Finding_: This is one single possible security issue found by a _scanner_ which is stored as [well-defined format](/docs/api/finding).

_Lurker_: This _sidecar_ is a generic component responsible to "lurk" the results spit out by _scanners_ and stores it into the _storage_ for further processing by the parser. 

_Operator_: The [operator pattern][k82-operator] is a common pattern in Kubernetes to extend Kubernetes.

_Parser_: This _job_ is a _scanner_ specific component which reads the raw stored findings from the _lurker_ and transforms them into the [well defined format](/docs/api/finding) for _secureCodeBox_ findings. Each scanner needs its own parser implementation. 

_Raw finding_: In contrast to _findings_ these are the raw results from the scanner before they were converted into the [well-defined format](/docs/api/finding) for findings.

_Scanner_: This is the main component to actually perform a scan. This is simply a container which encapsulates a scanner tool (e.g. nmap, nuclei etc.) and invokes it, parameterized by the _custom resource definition_ for this _scan type_.

_Scanner tool_: These are the command line tools we integrate into _secureCodeBox_ to perform the actual scan (e.g. Nmpa, Nuclei, Nikto, ZAP etc.). 

_Scan type_: Own _custom resource definition_ for the _secureCodeBox_ _scanners_.

_Sidecar_ : This is a [common DevOps pattern][k8s-sidecar] for Kubernetes. It is a container with one responsibility which extends a _container_. We use this pattern for the _lurker_.

_Security Operations Center (SOC)_: A unit, team or department responsible for monitoring and handle security issues and vulnerabilities in an organisation.

_Storage_: The component we use to store raw and parsed _findings_. 

[helm]:                         https://helm.sh/                  
[k8s]:                          https://kubernetes.io/
[k8s-custom-resources]:         https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/
[k82-job-doc]:                  https://kubernetes.io/docs/concepts/workloads/controllers/job/
[k82-operator]:                 https://kubernetes.io/docs/concepts/extend-kubernetes/operator/
[k8s-sidecar]:                  https://kubebyexample.com/en/learning-paths/operator-framework/kubernetes-api-fundamentals/side-car-pattern
[wiki-container]:               https://en.wikipedia.org/wiki/OS-level_virtualization
[wiki-Continuous-integration]:  https://en.wikipedia.org/wiki/Continuous_integration
