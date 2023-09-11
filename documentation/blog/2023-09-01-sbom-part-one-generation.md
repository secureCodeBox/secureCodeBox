---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: 'Developing an SBOM Workflow – Part 1: SBOM Generation'
author: Lukas Fischer
author_title: Core Developer
author_url: https://github.com/o1oo11oo
author_image_url: https://avatars.githubusercontent.com/u/1590475?v=4
tags:
  - secureCodeBox
  - comparison
  - SBOM
  - CycloneDX
  - SPDX
  - Trivy
  - Syft
description: We describe our plans to build an SBOM workflow for the secureCodeBox, including an SBOM tool comparison and interoperability troubles. This part treats the aspects of generating SBOMs.
image: /img/blog/2023-09-01-waterfall.jpg
---

![A waterfall](/img/blog/2023-09-01-waterfall.jpg)

Cover photo by [Mike Lewis HeadSmart Media](https://unsplash.com/@mikeanywhere) on [Unsplash](https://unsplash.com/photos/waAAaeC9hns).

In [the previous blogpost](/blog/2022/01/18/log4shell) we described how to use scans to find infrastructure affected by _Log4Shell_, but wouldn't it be way more convenient to already have this information available?
_SBOMs_ promise to offer that convenience of only having to look up, where an affected dependency is used, and immediately being able to mitigate it.
This blog post details our plans to integrate an ___SBOM_ creation workflow__ into the _secureCodeBox_ and our troubles with using different tools for it.

<!--truncate-->

## What are SBOMs?

_SBOMs_, or _Software Bills of Material_, are standardized and machine-readable __lists of components__ used in software.
While that would be pretty boring for monolithic applications without external dependencies, modern software often uses hundreds or even thousands of external dependencies, usually installed through the standard package ecosystem of that particular language.
With these kinds of applications, keeping track of what is used where could be as simple as checking the provided list of dependencies, i.e. `package-lock.json` or `Cargo.lock`.
_SBOMs_ __generalize__ this for applications of multiple ecosystems, multiple applications, whole containers or VMs.

As mentioned, _SBOMs_ use standardized formats, [unfortunately with an emphasis on the plural-s of formats](https://xkcd.com/927/).
The two most prolific standards are [_Software Package Data Exchange (SPDX)_](https://spdx.dev/), developed as a Linux Foundation Project and maintained as an ISO standard, and [_CycloneDX_](https://cyclonedx.org/), developed as an [OWASP Foundation](https://owasp.org/) project.
Sometimes [Software Identification (SWID) Tags](https://csrc.nist.gov/projects/Software-Identification-SWID) are also regarded as a format of SBOMs, but their use is a bit different, and they are not well-supported by most tools that work with SBOMs.
There are some differences between _SPDX_ and _CycloneDX_ SBOMs, [documented here](https://docs.google.com/spreadsheets/d/1PIiSYLJHlt8djG5OoOYniy_I-J31UMhBKQ62UUBHKVA/edit).
They can still be converted, for example by using the [CycloneDX CLI](https://github.com/CycloneDX/cyclonedx-cli) or the [cdx2spdx](https://github.com/spdx/cdx2spdx) tool.

## The Goal of This Endeavour

Currently, the _secureCodeBox_ provides a great selection of scanners, to assess the security of your infrastructure.
If instead you want to achieve a detailed overview over the __composition of the infrastructure__, you currently have to reach for other tools.
With this change we intend to leverage the integrations and automations already present in the _secureCodeBox_, to simplify generating SBOMs for all the targets, that could up to now only be scanned for security flaws present at that moment.

That is of course a very ambitious goal.
We intend to first release a minimum viable product of SBOM generation, aimed at a common use-case for the _secureCodeBox_: __container security__.
Combining SBOM creation for containers with the AutoDiscovery makes it a breeze to keep an up-to-date inventory over whole infrastructures.

The following sections describe our search for a good tool to __create SBOMs__, the troubles when combining the created SBOMs with tools that __consume SBOMs__ and the detailed plan for the MVP implementation.

## Possible Tools to Generate SBOMs

Before deciding on a _format_ for the SBOMs, let's take a look at the possible _tools_ we could use to generate them.
The best option would be to generate SBOMs directly __at build-time__.
At that point, all the dependencies of an application are clearly defined and the compiler or some other build tool can simply export a list of them in any format.
Unfortunately, that will __not work__ for our use case, as we want to generate __SBOMs for containers__ that are already running.
Luckily there are tools that allow that as well.
To select a fitting one, the following criteria apply.

### Tool Criteria

- __Which targets__ can SBOMs be created for? Currently we want to support containers, but in the future other targets like files or VMs might be needed as well.
- How can the __containers be accessed__? Not all containers can just be pulled from Docker Hub, so support for private registries is often needed.
- Credential management, how can private registries be accessed?
- SBOM __formats__, are both SPDX and CycloneDX supported, or only one of them?
- SBOM __contents and quality__, does the tool find all dependencies and properly specifies them?
- __Support and ecosystem__ of the tool: widespread use, GitHub activity, documentation quality
- __License__, as we cannot integrate a commercial tool

Of these criteria, checking the _quality_ of an SBOM is not that straightforward.
Confirming if all the dependencies of small demo applications are picked up is possible, but for containers the dependencies also include the OS packes and everything else that the container ships with.
SBOM quality will therefore also depend on the _interoperability_ with SBOM consuming tools.

### SBOM Targets and Testing Environment

To make the tests of the tools comparable, the same images were used as scan targets.
These images are intentionally insecure, so that there are components with known security vulnerabilities which can (and __should__) be found when analyzing the generated SBOMs.
The targets are:

- [`bkimminich/juice-shop:v15.0.0`](https://hub.docker.com/r/bkimminich/juice-shop)
- [`trivy-ci-test`](https://github.com/aquasecurity/trivy-ci-test)
- [A simple .NET-based containerized app](https://github.com/o1oo11oo/test-docker-images/tree/main/dotnet-docker-test)
- [A simple Rust-based containerized app](https://github.com/o1oo11oo/test-docker-images/tree/main/rust-docker-test), using the [cargo auditable](https://github.com/rust-secure-code/cargo-auditable) format

All tools were tested under macOS Ventura 13.5, or, if they did not (or not properly) support macOS, under Ubuntu 22.04.
Unless noted otherwise, the latest available version of the tools were tested.

### Tool List

The following list includes all the free and open source tools I looked at as possible integration for the _secureCodeBox_.
There is also a whole range of premium tools for SBOMs or even full software component analysis workflows, these are not listed here as they are not relevant for our goals.

This list does not cover all details of the compared tools, when it became obvious one is not a good fit I stopped checking the remaining criteria.
It is also not an exhaustive list, there are chances a good tool is missing, just because it does not have the reach of the ones listed.
Now with that out of the way, here is the list.

#### Trivy

[_Trivy_](https://github.com/aquasecurity/trivy), the "all-in-one open source security scanner", which is [already integrated](/docs/scanners/trivy) as a scanner in the _secureCodeBox_, also supports creating SBOMs as one of its output types.
Trivy supports scanning a [wide variety of targets](https://aquasecurity.github.io/trivy/v0.44/docs/) and provides SBOM support for most of them.
Other than containers, file system paths, git repositories, or VMs, Trivy also supports generating SBOMs for whole Kubernetes clusters.
The containers can be accessed in many different ways, either through the local Docker Engine, containerd, Podman, direct access to the registry, and also through local files in tar or OCI format.
[Credentials](https://aquasecurity.github.io/trivy/v0.44/docs/advanced/private-registries/) can be supplied either through environment variables, parameters (not recommended because credentials will be readable in the process list and the shell history), in a configuration file or directly to Docker.
There is also support for the AWS, Google and Azure registries.

Example commandline:
```bash
trivy image --format cyclonedx --output results-trivy-juiceshop-v15-cyclonedx.json bkimminich/juice-shop:v15.0.0
```

SBOMs can be generated in either SPDX or CycloneDX formats.
When using CycloneDX, security scanning, which is disabled by default for SBOM outputs, can be reenabled, to include a list of security flaws already in the SBOM itself.
While interesting, it is unclear how useful this is, after all the _secureCodeBox_ already supports [normal trivy container scans](https://www.securecodebox.io/docs/scanners/trivy/), which are integrated far better with the existing hooks.

SBOM quality and content depends on the content of the container.
Trivy supports [many package ecosystems of different languages](https://aquasecurity.github.io/trivy/v0.44/docs/scanner/vulnerability/language/), but might miss applications or dependencies installed in unusual or hard to read ways.
To find the dependencies of Rust binaries for example, Trivy relies on the `Cargo.lock` file being available or the binaries including the dependency information in a linker section according to the [cargo auditable](https://github.com/rust-secure-code/cargo-auditable) format.
In tests with small containers, Trivy was able to reliably pick up dependencies of the main application and OS packages.
For each component and depending on the output format, Trivy tracks among others the name, version, [package url (purl)](https://github.com/package-url/purl-spec) and several custom properties.

Trivy is actively maintained by [Aqua Security](https://www.aquasec.com/), has 18.2k Stars and 1.8k Forks [on GitHub](https://github.com/aquasecurity/trivy) and a very [extensive documentation](https://aquasecurity.github.io/trivy/v0.44/).
It is licensed under the Apache-2.0 license and used by GitLab for their [Container Scanning](https://docs.gitlab.com/ee/user/application_security/container_scanning/) feature.
For the tests in this blogpost, Trivy v0.44.0 was used.

#### Syft

[_Syft_](https://github.com/anchore/syft) works very similar to Trivy when it comes to generating SBOMs.
It supports containers, filesystem paths, archives, "and more" although it is not specified what "and more" entails.
This means Trivy supports more targets, which might be interesting long term, but for now Syft is perfectly capable of generating SBOMs for our use case as well.
Syft also supports [many ways](https://github.com/anchore/syft#supported-sources) to access container images, other than direct registry access or through the Docker or Podman daemons, tar archives, OCI or SIF images or plain directories and files are supported.
[Credentials for private registries](https://github.com/anchore/syft#private-registry-authentication) can to be supplied as Docker `config.json`, which can also be shared as a Kubernetes secret.
More advanced options are available according to the [go-containerregistry docs](https://github.com/google/go-containerregistry/tree/main/pkg/authn).

Example commandline:
```bash
syft bkimminich/juice-shop:v15.0.0 -o cyclonedx-json > results-syft-juiceshop-v15-cyclonedx.json
```

The list of supported [SBOM formats](https://github.com/anchore/syft#output-formats) is quite large, there is CycloneDX in xml or json, SPDX in tag-value or json, in version 2.3 or 2.2 and Syft's own format as json.
[Custom formats](https://github.com/anchore/syft#using-templates) can be defined using Go templates.

Regarding the quality of the SBOMs, Syft also has support for [many language ecosystems](https://github.com/anchore/syft#default-cataloger-configuration-by-scan-type) and largely finds the same packages as Trivy.
The difference lies in the way the package details are populated.
Like Trivy, Syft includes name, version, package url and some custom properties, but also [Common Platform Enumerations (CPEs)](https://nvd.nist.gov/products/cpe).
This allows more options for matching packages against different databases.

Syft is actively maintained by [Anchore](https://anchore.com/opensource/) and has 4.5k Stars and 412 Forks [on GitHub](https://github.com/anchore/syft).
The `README.md` file serves as documentation but covers a lot.
Syft is available under the Apache-2.0 license and provides the functionality of the [experimental `docker sbom` command](https://docs.docker.com/engine/sbom/).
For the tests in this blogpost, Syft v0.85.0 was used.

#### Tern

[_Tern_](https://github.com/tern-tools/tern) is a Python-based tool for generating SBOMs for containers.
It uses [skopeo](https://github.com/containers/skopeo) to access container registries, but only supports Docker API compatible registries or querying the local Docker daemon.
So while Skopeo also supports loading tar archives, OCI images or plain directories, Tern does not use these features.
Skopeo also supports [private registries](https://github.com/containers/skopeo#authenticating-to-a-registry), but figuring out how to access that functionality through Tern might require some tinkering.
In addition, Tern can work with Dockerfiles directly, but requires a running Docker daemon to build the images.

Example commandline:
```bash
tern report -f cyclonedxjson -i bkimminich/juice-shop:v15.0.0 -o results-tern-juiceshop-v15-cyclonedx.json
```

SBOM [format support](https://github.com/tern-tools/tern#report-formats) is pretty good, other than CycloneDX (json), SPDX (json and tag-value), custom yaml, html and json formats can be generated.

Unfortunately, the generated SBOMs are quite lacking compared to the ones Trivy or Syft generate.
While Tern finds the distribution and OS packages of the Juice Shop container, not a single NodeJS/npm component is included in the output.
Other containers show similar results, only OS packages are listed.
This is pretty unhelpful for creating an inventory of the software running in one's container infrastructure.

Tern is a ["tern-tools"](https://github.com/tern-tools) project with 884 Stars and 185 Forks [on GitHub](https://github.com/tern-tools/tern).
The most active maintainer is Rose Judge, an Open Source Engineer [at VMWare](https://blogs.vmware.com/opensource/author/rose-judge/).
The documentation is provided as Markdown documents in the [docs directory](https://github.com/tern-tools/tern/tree/main/docs), while general information can be found in the `README.md` file.
Tern is licensed under a BSD-2-Clause license.
For the tests in this blogpost, Tern 2.12.1 was used.

#### Microsoft SBOM Tool

[In 2022](https://devblogs.microsoft.com/engineering-at-microsoft/microsoft-open-sources-software-bill-of-materials-sbom-generation-tool/), Microsoft released [their SBOM generation tool](https://github.com/microsoft/sbom-tool), aptly named _SBOM Tool_.
According to `README.md` and [the commandline docs](https://github.com/microsoft/sbom-tool/blob/main/docs/sbom-tool-cli-reference.md) it can generate SBOMs for container images and supports several package ecosystems (through the [Component Detection](https://github.com/microsoft/component-detection) library).
Images seem to be accessed through the running Docker daemon (specifying sha256 hashes of local images with `-di sha256:<hash>` works), but there is no documentation about different usage options, other than specifying an image tag.

Example commandline:
```bash
sbom-tool-linux-x64 generate -m . -pn JuiceShop -pv 15.0.0 -ps BKimminich -nsb https://owasp.org/www-project-juice-shop -di bkimminich/juice-shop:v15.0.0
```

This looks a bit inconvenient compared to the other tools, because there are many more mandatory parameters.
Making the commandline simpler to use is a [known issue](https://github.com/microsoft/sbom-tool/issues/157).
Format support is quite limited, the SBOM tool only supports generating SPDX 2.2 reports in json format.
Not even the full output path is configurable, the SBOM file always gets created as `<ManifestDir>/_manifest/spdx_2.2/manifest.spdx.json`, where `ManifestDir` is the directory supplied with `-m`.

On macOS, analyzing linux containers is unavailable and generated SBOMs contain no entries, other than the information about the target container and the details provided as parameters.
On Linux components are detected, but just like Tern the SBOM Tool fails to find anything but OS packages, in any of the tested containers.
The [Component Detection `README.me`](https://github.com/microsoft/component-detection#readme) clarifies, that the library is "intended to be used at build time", and while the SBOM Tool docs also seem like the tool is supposed to be used at build time, it is never explicitly stated and the [docs mention](https://github.com/microsoft/sbom-tool/blob/main/docs/sbom-tool-cli-reference.md#scan-docker-images-for-dependency-packages) the possibility of generating SBOMs only for containers.
I suspect that analyzing containers is supposed to be combined with analyzing local project files, so the only SBOM-content that needs to come from analyzing the container are the OS packages.
All the dependencies of the containerized applications will already be known from analyzing the build files.

The SBOM Tool and the Component Detection library are both maintained by [Microsoft](https://devblogs.microsoft.com/engineering-at-microsoft/tag/sbom/) and licensed under the MIT license.
The SBOM Tool has 1.2k Stars and 89 Forks [on GitHub](https://github.com/microsoft/sbom-tool).
The documentation could be better, there are only some Markdown documents in the [docs directory](https://github.com/microsoft/sbom-tool/tree/main/docs) and the README.md file gives an overview.
For the tests in this blogpost, SBOM Tool v1.2.0 was used.

Component Detection (and with that, the SBOM Tool) [uses Syft internally to analyze Docker containers](https://github.com/microsoft/component-detection/blob/main/docs/detectors/linux.md).
Since this tool is less convenient to use than Syft, and does not work as well either (for only analyzing containers), it makes more sense to just use Syft directly then.

#### Kubernetes bom

[`bom`](https://github.com/kubernetes-sigs/bom) was created "to create an SBOM for the Kubernetes project", but can be used for other projects and containers as well.
There is no mention of how images are accessed, but it works without connecting to the local Docker daemon.
Other than by specifying image tags, images can also be read from tar archives.

Example commandline:
```bash
bom generate --format json -i bkimminich/juice-shop:v15.0.0 -o results-k8sbom-juiceshop-v15-spdx.json
```

`bom` only generates SPDX 2.3 SBOMs, in either json or tag-value format.
As noted [in the documentation](https://kubernetes-sigs.github.io/bom/tutorials/creating_bill_of_materials/#simplest-use-case-one-package), go dependencies can be included, but no other language ecosystems are supported.
Since it was developed for Kubernetes, [it focuses on Go applications](https://github.com/kubernetes-sigs/bom/issues/256#issuecomment-1491465939).
Finding Go dependencies does not work for containers containing Go applications though, like Tern or the SBOM Tool, `bom` only finds OS packages there.
This makes the generated SBOMs not very useful for our goals.

`bom` is maintained as a [Kubernetes SIGs](https://github.com/kubernetes-sigs) (Special Interest Groups) project.
It has 250 Stars and 31 Forks [on GitHub](https://github.com/kubernetes-sigs/bom).
The documentation is decent, other than some basic usage information in the `README.md` file, there are is a generated [documentation website](https://kubernetes-sigs.github.io/bom/) with some subpages.
For the tests in this blogpost, `bom` v0.5.1 was used.

#### Others

There are some other open source tools claiming _SBOM functionality_, but I did not look into them in depth for various reasons.

The [_SPDX SBOM Generator_](https://github.com/opensbom-generator/spdx-sbom-generator) by [opensbom-generator](https://github.com/opensbom-generator) is developed in Go and supports many different language ecosystems.
It is not a good fit for the _secureCodeBox_ though, because it can only generate SBOMs for build dependencies by reading package files.
It could still be used by analyzing the files contained in the container, but that solution is rather complicated and finicky compared to the tools listed above.

There is an experimental _Docker CLI plugin_ to create SBOMs for containers, called [`docker sbom`](https://docs.docker.com/engine/sbom/).
All it does though, is use Syft internally, which we could also directly use instead.

The CycloneDX project also maintains an SBOM generator which supports multiple ecosystems, called [_cdxgen_](https://github.com/CycloneDX/cdxgen).
Internally it [uses Trivy](https://github.com/CycloneDX/cdxgen/blob/f91efd77ea296eb103e702d78eac59e05c8eaa6f/binary.js#L296) to [detect OS packages](https://github.com/CycloneDX/cdxgen/issues/38) in containers.

Other than that there is a wide range of _non-free tools_, which we cannot integrate for licensing reasons.

### Selecting a Tool

From this list, _Trivy_ and _Syft_ are by far the most capable and easiest to use tools.
It is no surprise, that both are already integrated into other projects for SBOM workflows.
As mentioned above, Syft provides the functionality of the [experimental `docker sbom` command](https://docs.docker.com/engine/sbom/).
Trivy is used by GitLab for their [Container Scanning](https://docs.gitlab.com/ee/user/application_security/container_scanning/) feature.

Some of the tools listed here, including Trivy and Syft, come with _catalogers_ for different language and package manager ecosystems.
This enables them to find packages which were not installed through the default package manager of the system.
One remaining problem are packages installed directly as binary, without any kind of package manager.
Especially in containers this is pretty prevalent for the "main software" of a container.
This is a known issue for both Trivy and Syft: [trivy#481](https://github.com/aquasecurity/trivy/issues/481), [trivy#1064](https://github.com/aquasecurity/trivy/issues/1064), [trivy#2839](https://github.com/aquasecurity/trivy/issues/2839), [syft#1197](https://github.com/anchore/syft/issues/1197), [syft#1607](https://github.com/anchore/syft/issues/1607), [syft#1963](https://github.com/anchore/syft/issues/1963).
It seems that Syft's support for those kinds of binaries is slightly better, in the Juice Shop image, only Syft detects the actual node binary.
<!-- TODO: #346 Add link to part 2 -->
Before selecting one of these two as a tool for the MVP, it makes sense to look at the __other side__ of an _SBOM workflow_, the __consuming side__ in a second upcoming blog post.
