---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Migrating our Helm Charts to OCI registries"
author: Jannik Hollenbach
author_title: Core Developer
author_url: https://github.com/J12934
author_image_url: https://avatars.githubusercontent.com/u/13718901?v=4
tags:
  - secureCodeBox
  - helm
  - oci
  - registry
description: All secureCodeBox helm charts will be provided via OCI registry based charts in the future. The old registry will remain running until the end of 2024.
---

With the secureCodeBox 4.6.0 release, we are transitioning our installation instructions from the old `https://charts.securecodebox.io` Helm registry to the new Helm registry infrastructure, which uses Open Container Initiative (`OCI`) images to store charts.

## What Will Happen?

- The existing registry (`https://charts.securecodebox.io`) will be deprecated with secureCodeBox 4.6.0 and will be shut down at the end of the year.
- All 4.x secureCodeBox Helm charts are already published to our [OCI registry](https://github.com/orgs/secureCodeBox/packages?tab=packages&q=helm).
- All 4.x releases of secureCodeBox will be published to both registries. Version 5.0.0 will be the first release to be exclusively published to the OCI registry.
- All users are advised to migrate their Helm releases based on the charts from the OCI registries to ensure smooth operations.

## What Steps Are Required by Users:

You'll need to switch the source of your Helm charts to point to the OCI registry. This process is straightforward.

When using Helm via the CLI/CI:

```bash
# Before
helm --namespace securecodebox-system install securecodebox-operator secureCodeBox/operator

# After
helm --namespace securecodebox-system install securecodebox-operator oci://ghcr.io/securecodebox/helm/operator
```

Existing releases that have been installed using the `charts.securecodebox.io` registry can be switched easily:

```bash
# Prior installation:
helm upgrade --install nmap secureCodeBox/nmap --version 4.5.0

# To switch the same Helm release to OCI, simply install the release with the same name from OCI:
helm upgrade --install nmap oci://ghcr.io/securecodebox/helm/nmap --version 4.5.0
```

Both ArgoCD and Flux also support OCI Helm charts.

## Why Are We Doing This:

- **🧱 Stability**: The `https://charts.securecodebox.io` registry is the only component we need to self-host to provide secureCodeBox to the internet. There have been issues and downtime before, which we’d like to avoid in the future by having the charts hosted for us by the GitHub container registry.
- **💰 Cost Efficiency**: Hosting the charts requires a significant amount of bandwidth (about 4TB a month for the now quite large `index.yaml` file and the zipped Helm charts). We have migrated to a cheaper setup, but it has cost us some money in the past.
- **🤹 Ease of Use**: OCI-based charts don't require users to add the registry to their Helm installation beforehand. This will hopefully ease some friction for users who are not familiar with Helm.
