---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Run x86 Images With Kubernetes on Apple Silicon
author: Sven Strittmatter
author_title: Core Developer
author_url: https://github.com/Weltraumschaf
author_image_url: https://www.gravatar.com/avatar/3fe213284598b5cb69009665902c77a1
tags:
  - secureCodeBox
  - v2
  - kubernetes
  - macos
description: This blog article describes how to setup Colima container runtime on macOS to run x86 images in Kubernetes on Apple Silicon.
image: /img/blog/2024-10-25-a-close-up-of-a-computer-processor-chip.jpg
---

![A close up of a computer processor chip](/img/blog/2024-10-25-a-close-up-of-a-computer-processor-chip.jpg)

Cover photo by [Bill Fairs](https://unsplash.com/@moonboyz) on [Unsplash](https://unsplash.com/photos/a-close-up-of-a-computer-processor-chip--QALfjTlhTE).

Maybe you've heard from the shiny new CPUs from Apple: [Silicon](https://en.wikipedia.org/wiki/Apple_silicon). Besides the good things (low power consumption, less fan noise) they have not so shiny drawbacks. One ran into is the problem of running containers built with/for x86 architecture. Yes, the problem itself is completely solved: Multi arch images. But, not every project builds them. No, I'm not looking at you [DefectDojo](https://www.defectdojo.org/) 😉 BTW _secureCodeBox_ provides multi arch images 🤗 So, I tinkered around with my Mac to get our _secureCodeBox_ setup with DefectDojo up and running on Silicon Macs. Since there was not much help out there in the Internet I use this post to summarize the steps to get it run, for later reference.

## Colima FTW

I use [Colima](https://github.com/abiosoft/colima) since roundabout a year now as drop in replacement for Docker Desktop. Works great. It was never necessary to read docs. It runs x86 images emulated via Qemu. But running single containers is not sufficient for _secureCodeBox_. Kubernetes is mandatory. Until now, I used Minikube, but it can't run x86 images on Silicon Macs. KIND also does not support them, as my colleagues told me. Some days ago, I told a friend about Colima, and he said: "Oh, nice. It can start a Kubernetes cluster."

Remember, I've never read the docs 😬 To install Colima and start a Kubernetes just execute (I assume you have [Homebrew installed](https://docs.brew.sh/Installation).): 

```shell
brew install colima
colima start -f --kubernetes --arch x86_64
```

:::caution
This will _emulate_ an x86 vm under the hood. It is not _virtualized_ as usual. This brings a performance penalty.
:::

### Should I Use Brew Services to Launch Colima at Login?

**TL;DR**: No, don't!

Brew offers very simple solution to start such services on login it. Just simply run `brew services start colima` and Colima will always start on login.

:::caution
Never use `brew services` with `sudo`! This will break your Homebrew installation: You can't update anymore without hassle. The reason for that: Homebrew assumes that it is always executed in the context of an unprivileged user. If you run `brew services` with `sudo` files wil be written with "root" as owner. Since Homebrew always runs with your unprivileged user it can't modify such files anymore. Been there, done that. Its no good!
:::

The "problem" with `brew services` ia, that it always uses the [LaunchAgents](https://www.launchd.info/) plist-File from the brew. For Colima this means that `brew services start colima` always copies the file from the Homebrew's Formula to `~/Library/LaunchAgents/homebrew.mxcl.colima.plist`. But since this LaunchAgents definition invokes colima without the arguments `--kubernetes` and `--arch x86_64` you need to modify it:

```xml
...
<key>ProgramArguments</key>
<array>
    <string>/opt/homebrew/opt/colima/bin/colima</string>
    <string>start</string>
    <string>-f</string>
</array>
...
```

If you modify this file and restart the daemon via `brew services` **your changes will be lost**! [And this is by design](https://github.com/Homebrew/homebrew-services/issues/71).

You have two options:

1. Either start it by hand: `colima start --kubernetes --arch x86_64` or
2. handroll your own LaunchDaemon:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>EnvironmentVariables</key>
	<dict>
		<key>PATH</key>
		<string>/opt/homebrew/bin:/opt/homebrew/sbin:/usr/bin:/bin:/usr/sbin:/sbin</string>
	</dict>
	<key>KeepAlive</key>
	<dict>
		<key>SuccessfulExit</key>
		<true/>
	</dict>
	<key>Label</key>
	<string>de.weltraumschaf.colima</string>
	<key>LimitLoadToSessionType</key>
	<array>
		<string>Aqua</string>
		<string>Background</string>
		<string>LoginWindow</string>
		<string>StandardIO</string>
	</array>
	<key>ProgramArguments</key>
	<array>
		<string>/opt/homebrew/opt/colima/bin/colima</string>
		<string>start</string>
		<string>-f</string>
		<string>--kubernetes</string>
		<string>--arch</string>
		<string>x86_64</string>
	</array>
	<key>RunAtLoad</key>
	<true/>
	<key>StandardErrorPath</key>
	<string>/opt/homebrew/var/log/colima.log</string>
	<key>StandardOutPath</key>
	<string>/opt/homebrew/var/log/colima.log</string>
	<key>WorkingDirectory</key>
	<string>/Users/sst</string>
</dict>
</plist>
```

And store it in the file `~/Library/LaunchAgents/de.weltraumschaf.colima.plist`. Obviously, change "de.weltraumschaf" to whatever you like. Instead of Homebrew, now you need to use `launchctl` to interact with the LaunchAgent.

## Install secureCodeBox with DefectDojo

The rest is straight forward. To install _secureCodeBox_ simply execute (as documented [here](https://www.securecodebox.io/docs/getting-started/installation)):

```shell
helm --namespace securecodebox-system \
    upgrade \
    --install \
    --create-namespace \
    securecodebox-operator \
    oci://ghcr.io/securecodebox/helm/operator
```

Then install the scanners you want, e.g. [Nmap](https://nmap.org/):
```shell
helm install nmap oci://ghcr.io/securecodebox/helm/nmap
kubectl get scantypes
```

To install DefectDojo the easiest way is to clone their repo and install from it (as documented [here](https://www.securecodebox.io/docs/how-tos/persistence-storage/#defectdojo-kubernetes-setup)):

```shell
git clone https://github.com/DefectDojo/django-DefectDojo
cd django-DefectDojo

helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm dependency update ./helm/defectdojo

helm upgrade --install \
  defectdojo \
  ./helm/defectdojo \
  --set django.ingress.enabled=true \
  --set django.ingress.activateTLS=false \
  --set createSecret=true \
  --set createRabbitMqSecret=true \
  --set createRedisSecret=true \
  --set createMysqlSecret=true \
  --set createPostgresqlSecret=true \
  --set host="defectdojo.default.svc.cluster.local" \
  --set "alternativeHosts={localhost}"
```

Get DefectDojo admin user password:

```shell
echo "DefectDojo admin password: $(kubectl \
      get secret defectdojo \
      --namespace=default \
      --output jsonpath='{.data.DD_ADMIN_PASSWORD}' \
      | base64 --decode)"
```

Finally forward port to service:

```shell
kubectl port-forward svc/defectdojo-django 8080:80 -n default
```

Now you can visit the DefectDojo web UI at `http://localhost:8080`.
