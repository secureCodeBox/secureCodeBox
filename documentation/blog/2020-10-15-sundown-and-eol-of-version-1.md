---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Sundown and EOL of Version 1
author: Sven Strittmatter
author_title: Core Developer
author_url: https://github.com/Weltraumschaf
author_image_url: https://www.gravatar.com/avatar/3fe213284598b5cb69009665902c77a1
tags:
  - eol
  - sundown
  - v1
description: Sundown and end of live of secureCodeBox version 1.
image: /img/blog/2020-10-15-sundown.jpg
---

![Sundown](/img/blog/2020-10-15-sundown.jpg)

(Photo by [Zou Meng](https://unsplash.com/@xxm) on [Unsplash](https://unsplash.com/s/photos/sundown))

Sad news but the _secureCodeBox_ version 1 will soon reach its end of life. So here we announce its sundown phase beginning from now on until the end of the year.

<!--truncate-->

## Sundown

From today we announce the sundown phase of _secureCodeBox_ version 1. This means that we will **not implement any new features nor update any dependencies** in this version! We will only patch critical security issues or bugs.

Of course, you can submit pull requests or ask kindly for a bug fix. We may do it if we have the resources. But don't be annoyed if we won't. If you need urgently a patch you may pay us for doing it. But also don't be annoyed if we decline.

We won't put any more effort into the *secureCodeBox* version 1 as necessary and we want to focus on the work for *secureCodeBox* version 2.

## End of Live

The sundown phase will last until 31. December 2020. After that date, we will archive all the repositories belonging only to version 1 and won't do any updates or accept pull requests for version 1.

If you need patches after this date you must pay us or fork the sources and do it by yourself.

## Migrating to Version 2

Is there a migration tool or guide from version 1 to version 2? Short answer: No!

Version 1 and version 2 are so different that you can't migrate the installation automatically. It is necessary to knock down your version 1 installation and setup a fresh version 2.

It may be possible to migrate the data collected by version 1 in Elastic. But at the moment we do not provide tools to migrate this data. Maybe we will provide such a tool in the future. It depends on the demand. We don't want to put effort into something nobody needs. We dropped our data from version 1 and started from scratch.

## Please Sorry 🥺

So you may face a major fuckup now. We understand that such a move is almost always quite a bit annoying. That's why we ask you for sorry and hope we won't lose you as a *secureCodeBox* user. If you need help moving to *secureCodeBox* version 2 don't hesitate to ask us for help! You can reach us at ~~[Twitter](https://www.twitter.com/secureCodeBox)~~[Mastodon](https://infosec.exchange/@secureCodeBox), [OWASP Slack](https://owasp.org/slack/invite) (Channel `#project-securecodebox`), E-Mail (securecodebox [at] iteratec [dot] com) or just file an issue at GitHub.

Finally to cheer you up a little cute kitten:

![Cute kitten](/img/blog/2020-10-15-cute-kitten.jpg)

(Photo by [Andriyko Podilnyk](https://unsplash.com/@yirage) on [Unsplash](https://unsplash.com/s/photos/kitten))
