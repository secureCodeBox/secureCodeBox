---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Windows Scanners and the secureCodeBox
author: Sebastian Franz
author_title: Contributor
author_url: https://github.com/SebieF
author_image_url: https://avatars.githubusercontent.com/u/32578476?v=4
tags:
- secureCodeBox
- windows
- scanners
- pingcastle
description: This post describes our journey to integrate a Windows scanner into the scb.
image: /img/blog/2021-08-09-windows.jpg
---

![Windows](/img/blog/2021-08-09-windows.jpg)

Cover photo by [Tadas Sar](https://unsplash.com/@stadsa) on [Unsplash](https://unsplash.com/photos/T01GZhBSyMQ).

Get some insights into the fascinating and exhausting world of integrating Windows™ scanners into the _secureCodeBox_.

<!--truncate-->

## Windows Security

To date, Microsoft Windows is still the most popular operating system, especially in office or work related areas.
Unsurprisingly, [the majority of malware](https://www.statista.com/statistics/680943/malware-os-distribution/) is also created for windows.
While most of the scanners already implemented in the _secureCodeBox_ can target and be run on any operating system,
the need for Windows-specific security measures is blatant.
There exist several security scanners that target specific Windows-related security aspects, such as 
[Mandiant](https://www.fireeye.com/mandiant.html) or [PingCastle](https://pingcastle.com/).
PingCastle scans a domain with an Active Directory (AD), reporting any risks that can result from disproportionately 
privileged accounts or weak password policies for example. 
It is the first scanner that we went for integrating in the _secureCodeBox_, and what a journey it was!
Join us on our path to automated Windows security, including a lot of inception, dirty workarounds and a sour taste of
Wine...

## Integrating PingCastle into the secureCodeBox - First Attempts

So here was our starting point: We already ran some successful scans of PingCastle against our own AD. So it would
be nice to automate the scans and get informed if some critical issues arise. As this is the whole point of our
_secureCodeBox_, we wanted to add PingCastle as a scanner and eventually provide the community (you) with a possibility
to do the same. 
As all of our scanners run on Linux distributions to date, it would not be feasible to simply add a Windows Docker
container to our Kubernetes cluster, as Linux and Windows Docker environments are not easily interchangeable.
So the idea was simply to run PingCastle in a Linux container. Well, it didn't turn out to be that simple...

As [PingCastle is open source](https://github.com/vletoux/pingcastle), our first attempt was to compile it ourselves
with Mono or .NET for Linux. We tried it to no avail. After some talks with professional .NET developers, we decided
that this approach will exceed both our time and knowledge capabilities. 

So the next idea was to run it with [Wine](https://wiki.ubuntuusers.de/Wine/). If this worked, we would have had a pretty
stable solution that could probably be applied for a lot of Windows scanners. Unfortunately, PingCastle did start
and execute in our Wine environment, but failed to execute any scans against our AD. After trying a lot of stuff
with adding our computers to the domain and using VPN connections, we had to give up. Probably, PingCastle in the
Wine environment does not have the required access to some DLLs needed for the scan or PingCastle itself is just a 
little picky as we will see later... 
However, maybe we will come back to Wine in the future for other Windows scanners.

## Starting the inception

So we finally came up with a rather "brute-force" method: If PingCastle solely runs on Windows - why not put Windows
into a Linux container? Virtual machines (VMs) have become a well-known tool to achieve stuff like this. After solving some
problems setting it up, we could confirm that it actually worked to run a Windows VM in a Linux Docker Container!
(Running on our Ubuntu main OS, providing the [Virtual Box](https://www.virtualbox.org/) driver, so that the VM 
actually does not run in the container but rather on the host OS, the inception took off!)

After that we prepared the Windows 10 virtual machine image by adding it to the domain, linking it to our VPN and 
finally installing PingCastle. We could confirm that the scans inside the VM ran properly, but surprisingly a major
issue with the VPN arose. Of course, one has to connect to the VPN automatically on start-up in order to run the scans
from outside the machine. It turned out, however, that PingCastle is indeed very picky. It always refused to work
while the machine was connected automatically to the VPN 
(e.g. using [rasdial](https://docs.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/ff859533(v=ws.11))).
It would, however, perfectly do its job when being connected manually to the VPN! 
We tried a lot here, and you can read all about our dirty workaround to finally make it work in our related extensive
["Tutorial"](https://github.com/secureCodeBox/secureCodeBox/blob/pingcastle/scanners/pingcastle/scanner/Tutorial.md).

## Conclusion

With this tutorial you should be able to reproduce our attempt and set up a working container that is actually 
capable to be integrated into the _secureCodeBox_. We already provide you with all other necessary files, especially
the parser that automatically converts the PingCastle scan *xml* to our _secureCodeBox_ findings format.
Be aware, however, that the solution is not yet stable for production and that you could still face some major issues 
with it. For example, it is not yet clear to us how the container will behave when being deployed over a long period
of time. Maybe the VM will shut down unexpectedly, and we all know and love the [BSoD](https://en.wikipedia.org/wiki/Blue_screen_of_death) 
when Windows refuses to start normally. This, of course, would also hinder any automatic scans from being executed.

That is why we are thankful for any comments, experience reports or even suggestions, how to improve our chosen
setup. In addition, if you have any questions or face any issues, please also let us know!
