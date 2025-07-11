---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: secureCodeBox as a Service
author: Sven Strittmatter
author_title: Core Developer
author_url: https://github.com/Weltraumschaf
author_image_url: https://www.gravatar.com/avatar/3fe213284598b5cb69009665902c77a1
tags:
  - kubernetes
  - release
  - secureCodeBox
description: We are launching secureCodeBox as a Service so that you can try it out without your own Kubernetes cluster.
image: /img/blog/2025-07-10-scbaas-form.jpg
---

Have you ever wanted to try out _secureCodeBox_ but don't have a Kubernetes cluster on hand? We have a solution for that: [secureCodeBox as a Service](https://scb.iteratec.de).

![secureCodeBox as a Service initial form](/img/blog/2025-07-10-scbaas-form.jpg)

<!--truncate-->

In the last years we gained some attraction with our project, as you can see by the GitHub stars:

![secureCodeBox GitHub stars](/img/blog/2025-07-10-scb-stars.svg)

But one of the major concerns we often heard in the past was:

> Nice project, but I don't have a Kubernetes cluster to try it out.

Setting up a Kubernetes cluster is a major concern if you're not used to it. What seems to be a no-brainer for DevOps Engineers may be show-stopper for e.g. security engineers, pentesters, CISOs, Product Owners, etc. who just want to try it out.

That's the reason why we decided last year to start building [secureCodeBox as a service](https://scb.iteratec.de), and now it's in a state where we can put it in front of the public. For that, we set up a dedicated Kubernetes cluster and developed a simple Web UI to interface with secureCodeBox. So you don't need to mess around with `kubectl` on command line 🤗

At the moment, we do a [very basic cascading scan](https://scb.iteratec.de/about):

1. We scan for all subdomains.
2. We scan for all open ports on each found hostname.

We plan more elaborated scans for the future, e.g.:

- TLS
- SSH
- dangling DNS
- ...

:::note Is it really that simple?
Of course not! 😂

We need to prevent that arbitrary internet users scan random domains they do not own because this could be interpreted as attack, and the owners may sue us. 😬

To mitigate this, we implemented a _Domain Validation_ process. To validate your domain, you need to add a challenge to your DNS zone, so that we are sure that you "own" this particular domain. Sadly, this raises the bar for technical skills required for use. So either you can administer your DNS zone, or you have someone from operations on hand, who can do that for you. 

Also, we require you to accept a very lightweight [terms of use](https://scb.iteratec.de/terms). 
:::

## Why Hosted on a Company Domain?

Maybe you recognized that [secureCodeBox as a service](https://scb.iteratec.de) is hosted under a company domain of the [iteratec GmbH](https://www.iteratec.com). _iteratec_ is the main sponsor of _secureCodeBox_. The reason why we host the service there instead under the open source project's domain is for legal reasons. Since we're located in Germany, and we have something called the "Hackerparagraph" (you can be sued for scanning if not permitted by the owner of the scanned systems). To prevent the individual maintainers or maybe the [OWASP](https://www.owasp.org) getting sued, we needed a legal entity to be in charge and as a legal party for the terms of use. Of course, we asked a lawyer. 😉
