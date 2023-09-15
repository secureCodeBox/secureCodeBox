# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

# Source: Example code for the semgrep rule "python.django.security.injection.command.command-injection-os-system.command-injection-os-system"
import os


def danger(request):
    # ruleid: command-injection-os-system
    url = request.GET["url"]
    os.system("wget " + url)


def danger2(request):
    # ruleid: command-injection-os-system
    image = request.POST["image"]
    os.system("./face-recognize %s --N 24" % image)


def danger3(request):
    # ruleid: command-injection-os-system
    url = request.GET["url"]
    os.system("nslookup " + url)


def ok(request):
    # ok: command-injection-os-system
    url = request.GET["url"]
    os.system("echo 'hello'")
