---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: We Remove Vagrant Setup
author: Sven Strittmatter
author_title: Core Developer
author_url: https://github.com/Weltraumschaf
author_image_url: https://www.gravatar.com/avatar/3fe213284598b5cb69009665902c77a1
tags:
  - eol
  - macos
description: We remove the Vagrant All-in-One Setup completely.
---

**TL;DR** We remove the Vagrant All-in-One Setup completely.

<!--truncate-->

Since the introduction of Apple Silicon CPUs we couldn't run [Vagrant][vagrant] with [Virtualbox][virtualbox] anymore because Virtualbox is not ported on ARM at the moment. This may change in the future. I've also tried to get Vagrant up and running with other hypervisors (e.g. VMWare, QEMU), but didn't worked out well 😫

Since the setup of _secureCodeBox_ with [Minikube][minikube], [Kind][kind] or [Colima][colima] is quite easy we drop Vagrant completely. With Colima, you can also run x86 images easily on arm hist as described in [Run x86 Images With Kubernetes on Apple Silicon][colima-setup].

To be honest, using VMs is so 20th century like 😬

[vagrant]:      https://www.vagrantup.com/
[virtualbox]:   https://www.virtualbox.org/
[colima]:       https://github.com/abiosoft/colima
[colima-setup]: /blog/2024/10/25/run-x86-images-with-kubernetes-on-apple-silicon
[minikube]:     https://minikube.sigs.k8s.io/docs/start/?arch=%2Fmacos%2Fx86-64%2Fstable%2Fbinary+download
[kind]:         https://kind.sigs.k8s.io/
