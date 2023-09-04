---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Architecture Introduction"
sidebar_label: "Introduction"
sidebar_position: 1
---

This document describes the _secureCodeBox_ Project (SCB) and is based on the [arc42][arc42] architecture documentation template. _secureCodeBox_ is a [Kubernetes][k8s] based, modularized toolchain for continuous security scans of your software project. Its goal is to orchestrate and easily automate a bunch of security-testing tools out of the box. With _secureCodeBox_ we provide a toolchain for continuous security scanning of applications or infrastructures to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

## Road Map

As of **Feb, 2021, the highest priorities for the next 12 months** are:

- Finalize a new Kubernetes *autodiscovery* service, which is capable of generating new secureCodeBox Scans based on existing or newly spawned Kubernetes resources.
- Finalize the deep integration with the OWASP DefectDojo Project, as a building block for security finding analytics.
- Implement a  secureCodeBox UI to visualize the security scan findings as an alternative to OWASP DefectDojo and Kibana (ELK Stack).
- Integrate new Cloud-specific security scanners for AWS, GCP, Azure, DigitalOcean.

## Conventions Used in this Documentation

Some words about the structure, tools and style guide to follow, if you plan to contribute to this architecture documentation. This section about convention is as brief as possible 🙃

### Structure

As mentioned above we use [Arc42][arc42] as template for this documentation. This means that the whole architecture documentation is structured into 12 chapters as described in the [Arc42 overview][arc42-overview]. The basic concept of arc42 is to provide a standardized structure to "put your knowledge" into. This does not necessarily mean that you must write something into each chapter. The basic idea is to fill the chapters as needed: If you have something important to say about the architecture, then fill the free space given by the template. Thus, we have some empty parts. They will disappear over time.

:::info
We do not have the aspiration to have a complete and comprehensive architecture documentation. This documentation is meant to be a living document evolving over time. There is no restriction who can contribute to the architecture documentation: Everybody who notices wrong, outdated or missing information is invited to open pull requests.
:::

:::caution
If you look closely, you will see that we omitted chapters from the [Arc42][arc42] template. This is intentional because it is not recommended to fill all the template, if it does not value to the documentation. E.g. we removed chapter two _architecture constraints_. That's done because we do not face any constraints driven from outside our team. All constraints are chosen by the team and therefore rather a _solution strategy_. 
:::

### Images and Diagrams

For diagrams, we us [UML][wiki-uml] notation, if appropriate. This is a widely adopted industry standard and the most important concepts and syntax is widely understood. We try to use UML "the right" way, but we do not have the aspiration to draw perfect UML diagrams. The important part is that everyone understands the diagrams as easily as possibly. Therefore, **a diagram should always have a legend**, unless the meaning of the "boxes and arrows" is obvious. Keep in mind: What is obvious to you, may be a mystery for someone else 😉.

As tool, we use [Draw.io][drawio] with its default color scheme and as format we use _editable PNG_. The images are stored in the directory `static/img/docs/architecture/`.

The **only exception** to not use Draw.io is for [sequence diagrams][wiki-uml-sequence]. This type of diagram is very tedious and time-consuming to edit with mouse in a classical drawing tool. The reason is you end up in moving lifelines back and forth all the time when insert or remove something in the diagram. We use a text-based tool [PlantUML][plantuml] to generate sequence diagrams because insertion or removal of ne lifelines is simply add or remove a line of text. The PlantUML files (`*.puml`) are stored also in `static/img/docs/architecture/`. There is a make target to generate the images. Simply invoke `make` to see a help with the available targets.

### Style Guide

:::caution
We do not add linebreaks to split lines longer than 80 characters. **We write whole paragraphs as a single line** because all editors support soft-wrap for long lines, and it is tedious to reformat a whole paragraph on insertion/deletion of a single word.
:::

This section describes how to markup text in this documentation:

* _Emphasise named things_: Emphasis (usually formatted as _itallic_) is used for terms with special meaning. E.g. everything in the [glossary](/docs/architecture/glossary) is a good candidate. The rationale behind this rule is that readers easily recognize a term as something with special meaning in the context of _secureCodeBox_. For example the term _parser_ has a lot of different meaning depending on the context this term is used. In the context of _secureCodeBox_ a _parser_ has very special and narrow meaning. So, the reader sees that this word has a special meaning.
* **Strong important things**: Important things which should be recognized, even if a reader only skims over the text, should be marked up strong.
* `Use code for code`: The inline code markup should only be used for things which can be copied and pasted as-is into the described context. For example, you write about the image directory (`static/img/docs/architecture`) you can mark up it as code because you can simply copy and paste this into your terminal. Same applies if it is a command or code snippet. Do not use this to emphasize things.
* "Quote direct speech or quotes": Usually developers tend to use single or double quotes in texts to emphasise things because we are used to this from the most programing languages, but here a prime school reminder: Quotes are for quoting someone or direct speech. 

[arc42]:              https://arc42.org/
[arc42-overview]:     https://arc42.org/overview/
[k8s]:                https://kubernetes.io/
[wiki-uml]:           https://en.wikipedia.org/wiki/Unified_Modeling_Language
[drawio]:             https://app.diagrams.net/
[wiki-uml-sequence]:  https://en.wikipedia.org/wiki/Sequence_diagram
[plantuml]:           https://plantuml.com/
