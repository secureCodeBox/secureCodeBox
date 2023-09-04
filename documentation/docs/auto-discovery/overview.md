---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "AutoDiscovery Overview"
sidebar_label: "Overview"
path: "docs/auto-discovery/overview"
sidebar_position: 0
---

# Overview

The secureCodeBox (SCB) AutoDiscovery is an optional component that automates the process of setting up scheduled scans for Kubernetes resources inside a cluster. The AutoDiscovery will observe the scanned Kubernetes resources over their whole lifecycle. It will automatically create, update and delete scans when necessary. Currently the SCB AutoDiscovery supports two modes that can be enabled independently:

- [Service AutoDiscovery](./service-auto-discovery): Creates scans for (http) services inside a kubernetes cluster. With it you can automatically start scanners like OWASP ZAP or nuclei for all web applications inside the cluster.

- [Container AutoDiscovery](./container-auto-discovery): Creates scans for containers running inside a kubernetes cluster. This allows you to automatically create trivy container image scans for all container images inside a cluster.
