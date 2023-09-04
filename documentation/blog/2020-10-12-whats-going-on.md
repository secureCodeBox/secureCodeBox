---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: What's Going On
author: Sven Strittmatter
author_title: Core Developer
author_url: https://github.com/Weltraumschaf
author_image_url: https://www.gravatar.com/avatar/3fe213284598b5cb69009665902c77a1
tags:
  - secureCodeBox
  - v1
  - v2
description: This post gives a brief outline about what's going on in the secureCodeBox project.
image: /img/blog/2020-10-12-fingerpost.jpg
---

![Fingerpost](/img/blog/2020-10-12-fingerpost.jpg)

Photo by [Javier Allegue Barros](https://unsplash.com/@soymeraki) on [Unsplash](https://unsplash.com/).

Maybe you're wondering what's going on with my beloved _secureCodeBox_. If you look at the [GitHub insights](https://github.com/secureCodeBox/secureCodeBox/pulse) for the main repo, you'll see: Not that much is going on:

![Commits in the last months](/img/blog/2020-10-12-commits.png)

So is _secureCodeProject_ dead? Of course not! But we gained a lot of experiences using _secureCodeBox_ and went through some changes in the last couple of months. In this blog post, I'll give you a brief outline of all these changes and what we aim to do in the near future.

<!--truncate-->

## The State of the Union

I teased you with the experiences we gained from using _secureCodeBox_. Since these were the major reason for the changes let me start with them.

### Project MKULTRA

Initially, the goal of _secureCodeBox_ was to provide a tool for easy integrating security test tools into your CI/CD pipeline to run against your web project. Some years ago we asked ourselves: Why only scan a single project? So a great idea was born: Consider the whole company as a project. We started this as a side project with the code name _MKULTRA_. There is no good reason for the name. We needed a name for the Git repository and for an unknown reason this was the first thing that crossed my mind 😂

So we built a large scale scan for the whole company. I'll not go into the details here. This is a good topic for an upcoming post. Essentially we did a [Nmap][nmap] scan of the whole company's network and for the found hosts we do subsequent scans like [Nikto][nikto], [SSLyze][sslyze], [Ncrack][ncrack], [ssh_scan][ssh_scan], etc. Here the first problem emerged: The original design of the _secureCodeBox_ does not fit very well for this use case of cascading scans. We had to do some workarounds to achieve this by writing a lot of Jenkins and Python scripts to orchestrate multiple _secureCodeBox_ scans. That was cumbersome and not very satisfying.

A second major drawback of the original architecture we stumbled upon is the fact that the scanner containers are running  all the time in idle mode waiting for the scan engine to tell them to do something. Not a big deal if you have a handful of scan containers shared among dozens of projects using them. But it becomes a big deal when you do a specialized large-scale scan as we did. The bills to pay have grown constantly. (Hint: No cloud is not necessarily cheap 😉)

### Some Theoretical Work

One of our master students wrote his master thesis about the topic of how we could implement the _secureCodeBox_ more FAAS style so that scan containers only consume resources when they do work. Also I'll not go into much detail here. Be patient for an upcoming post. But to get a glimpse of the idea: Basically, we swap out the whole engine from _secureCodeBox_ which did the orchestration of the containers with [Kubernetes][kubernetes] and define the scanners as [custom resources][custom-resources].

### Version 2 Was Born

So the idea of a version 2 was born. That happened around the beginning of this year. Due to the fact of limited resources in the team of core maintainers, we decide in spring to stop any work on version 1 and fully focus on version 2. And here it is! We did a lot of work and we are proud to announce that we are on the brink of  a release. If you are curious about version 2 you can check out the [pre-release version][scb-v2] at GitHub. We're currently working on the final touch and hope that we can merge and release it in the next view weeks.

### What Else?

We also decided to move more towards GitHub. We're a traditional software project company and we're quite new in the field of open source. So we struggled a bit with our project management. We used a wild mixture of Trello boards, GitHub issues, Excel sheets, and once a while we had discussions about our workflow: Is this only internal stuff or is it open source? Should this be a Trello card or a GitHub issue? Should we mirror the Tasks? Should we use Jira like our big projects?

In consequence, we decided to put as much as possible at GitHub to be open to the community as much. So we also try to plan our sprints and goals with the GitHub project feature.

Also, we decided to do more and better communication with the community. In the past, we were not very good in communicate what we plan to do. This is the reason why we started this blog to give you more information about our plans and our rationales.

[nmap]: https://nmap.org/
[nikto]: https://cirt.net/Nikto2
[sslyze]: https://github.com/nabla-c0d3/sslyze
[ncrack]: https://nmap.org/ncrack/
[ssh_scan]: https://github.com/mozilla/ssh_scan
[kubernetes]: https://kubernetes.io/
[custom-resources]: https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/
[scb-v2]: https://github.com/secureCodeBox/secureCodeBox
