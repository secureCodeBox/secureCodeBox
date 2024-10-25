---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Removing Mozilla ssh_scan ScanType in 4.10.0
description: In release 4.10.0, we are removing the ssh-scan ScanType due to the deletion of the associated Docker Hub repository. Users are advised to switch to the newer ssh-audit scanner, introduced after the deprecation of Mozilla's ssh_scan project.
author: Jannik Hollenbach
author_title: Core Developer
author_url: https://github.com/J12934
author_image_url: https://avatars.githubusercontent.com/u/13718901?v=4
tags:
  - secureCodeBox
  - ssh
  - scantype
---

We are removing the ssh-scan ScanType With release 4.10.0.
The ssh-scan ScanType was using the [mozilla/ssh_scan](https://github.com/mozilla/ssh_scan) project.

We already had the release scheduled for the next breaking release (v5.0.0), but we can't wait until then as the Docker Hub repository (`docker.io/mozilla/ssh_scan`) which contained the scanner was already deleted by either Mozilla or DockerHub.
This makes using the scanner in any version no longer possible.

If you were still using the ssh-scan ScanType, we recommend switching over to the newer [ssh-audit](https://www.securecodebox.io/docs/scanners/ssh-audit) which we added after the deprecation of the Mozilla ssh_scan project.
