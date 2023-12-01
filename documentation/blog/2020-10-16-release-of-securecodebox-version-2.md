---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Release of Version 2
author: Sven Strittmatter
author_title: Core Developer
author_url: https://github.com/Weltraumschaf
author_image_url: https://www.gravatar.com/avatar/3fe213284598b5cb69009665902c77a1
tags:
  - secureCodeBox
  - release
  - v2
description: Here we announce the release of secureCodeBox version 2.0!
image: /img/blog/2020-10-16-firework.jpg
---

![Firework](/img/blog/2020-10-16-firework.jpg)

(Photo by [Elisha Terada](https://unsplash.com/@elishaterada) on [Unsplash](https://unsplash.com/s/photos/firework))

We are very happy and proud to announce the [release version 2.0.0](https://github.com/secureCodeBox/secureCodeBox/releases/tag/v2.0.0) of _secureCodeBox_. It is a better, faster and greater _secureCodeBox_ since ever 😀

<!--truncate-->

To get your hands on it you need a running [Kubernetes](https://kubernetes.io/) cluster and [Helm](https://helm.sh/). [Docker Desktop](https://www.docker.com/products/docker-desktop) with enabled Kubernetes is sufficient for your first steps. We have worked really hard to provide you a comprehensive [documentation](https://www.securecodebox.io/). There you find [installation instructions](https://www.securecodebox.io/docs/getting-started/installation) and how to [start your first scan](https://www.securecodebox.io/docs/getting-started/first-scans).

:::caution

Please note that scanning random hosts may be illegal. Please scan only hosts you are responsible for and you are permitted to do this. Everything you do with the _secureCodeBox_ is completely your responsibility.

:::

If you miss something in our documentation or you think it is unclear or wrong described. Please feel free to file an [issue](https://github.com/secureCodeBox/documentation/issues). If you need any help with your brand new _secureCodeBox_ don't hesitate to contact us via [Twitter](https://www.twitter.com/secureCodeBox), [OWASP Slack](https://owasp.org/slack/invite) (Channel `#project-securecodebox`), E-Mail (securecodebox [at] iteratec [dot] com) or just file an [issue](https://github.com/secureCodeBox/secureCodeBox) at GitHub.

## What's New in secureCodeBox v2

The big changes we did in the architecture of _secureCodeBox_ we we will discuss in a later post. For now I'll give you only a brief outline of the hottest key features:

- **Kubernetes bases orchestration of scans**: This means that we do not need the whole engine known from version 1.
- **No UI anymore**: In consequence, this means without the engine there is also no web UI anymore.
- **Cascading scans**: Now it is possible to feed the result of a scan into subsequent scans.
- **Resource consumption**: Massive reduction of consumed CPU and RAM because scanners only run when they scan.
- **Stability and scalability**: At [iteratec](https://www.iteratec.com) we run approximately a thousand scans a day against our infrastructure 😍

## What about secureCodeBox v1

Due to the fact of limited resources, we can't afford the maintenance for version 1. So we are forced to announce the [sundown and end of life](/blog/2020/10/15/sundown-and-eol-of-version-1) for _secureCodeBox_ version 1.
