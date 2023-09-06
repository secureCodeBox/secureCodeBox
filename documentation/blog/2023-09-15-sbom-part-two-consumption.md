---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: 'Developing an SBOM Workflow – Part 2: SBOM Consumption'
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
  - Dependency-Track
description: We describe our plans to build an SBOM workflow for the secureCodeBox, including an SBOM tool comparison and interoperability troubles. This part treats the aspects of consuming SBOMs.
image: /img/blog/2023-09-01-waterfall.jpg
draft: true
---

<!-- TODO: #346 Use another image? -->
![A burning log](/img/blog/2023-09-01-waterfall.jpg)

This is part two of the SBOM story which covers the consuming side. If you missed part one, you can find it [here](/blog/2023/09/01/sbom-part-one-generation).

One would assume that with a standardized format the combinations of generator and consumer are interchangeable, but as noted previously, the SBOMs still vary in content and attributes.

## Possible SBOM Consumers and Interoperability Troubles

Generating SBOMs is a nice first step of the workflow, but at some point you probably want to actually use them for something, and most people would prefer to use something more advanced than grep or a text editor.
There is a good amount of possible tools to work with SBOMs, both the [SPDX](https://spdx.dev/tools-community/) and the [CycloneDX website](https://cyclonedx.org/tool-center/) contain a list.
Most of the analysis tools provide license compliance, so there are not that many to work with them for vulnerability management, which is what we want to focus on for the _secureCodeBox_.

### SBOM Consumers

There are still multiple options for consuming SBOMs when focusing on vulnerabilities.
To integrate one of them with a hook for an SBOM workflow, a continuously running tool as a service is needed.
This list nevertheless contains some tools, that are only usable for one-off analyses.
These were used for general SBOM quality comparisons.

#### Trivy

Since Trivy is primarily a security scanner, it can also scan SBOMs for security vulnerabilities.
Of course generating SBOMs with Trivy just to scan them with Trivy later is not the most interesting use case, especially since the secureCodeBox [already supports Trivy scans](https://www.securecodebox.io/docs/scanners/trivy/).
It does still serve as an interesting baseline, to compare Trivy SBOM scan results to direct Trivy scans.

When directly scanning the Juice Shop image, Trivy detects 23 issues in debian packages and 67 in node packages, some as "fixed" and some as "affected".
Scanning the Juice Shop CycloneDX SBOM returns the same 23 debian issues, but only 51 node vulnerabilities.
Comparing the lists shows that there are fewer reported vulnerabilities for the semver package.
Turns out, that the same version of semver is included multiple times throughout the dependency tree, which gets deduplicated in the produced SBOM, but counted as individual vulnerabilities for the direct scan.
Other than that the same vulnerabilities are reported.
The SPDX SBOM contains all the semver usages and reports 67 node vulnerabilities again.

For the Syft SBOMs, Trivy reports only 8 debian vulnerabilities, all for `openssl`.
The ones for `libc6` and `libssl1.1` are not picked up.
For node 51 vulnerabilities are reported, which is interesting, because Syft does _not_ deduplicate components in its SBOMs, so the same semver versions are listed multiple times.
Trivy also warns about inaccuracies in scans of third party SBOMs, which is unfortunate, after all the point of standards is interoperability.

#### Grype

Compared to Trivy, Syft is only a tool to generate SBOMs, not a security scanner to gain insight from SBOMs or other sources.
Anchore offers a companion application to Syft, called [Grype](https://github.com/anchore/grype), which can then be used to scan SBOMs for vulnerabilities.
Grype can also directly scan container images.

Scanning the same Juice Shop image with Grype directly reveals 87 security vulnerabilities.
The same is true for scanning Syft's json or CycloneDX output.
The SPDX output produces 71 vulnerabilities, the missing ones are again the deduplicated semver issue [GHSA-c2qf-rxjj-qqgw](https://github.com/advisories/GHSA-c2qf-rxjj-qqgw).
Scanning Trivy SBOMs with Grype reveals fewer issues, 56 for both the SPDX and the CycloneDX SBOM.
Other than the missing duplicated semver issue, some glibc CVEs are missing and some OpenSSL vulnerabilities are only found for OpenSSL instead of for OpenSSL and libssl both.

If an SBOM does not contain CPEs, Grype offers to add them to improve vulnerability discovery.
For the Trivy SBOMs this did not increase the amount of vulnerabilities recognized.

#### Dependency-Track

The problem with both those tools is, that they are one-off invocations, consuming a single SBOM.
A continuous SBOM workflow needs a continuosly running service to accept the SBOMs, which then get analyzed regularly and can be checked for components or vulnerabilities.
[OWASP Dependency-Track](https://dependencytrack.org/) is a self hosted service that offers exactly that.
SBOMs can be uploaded through the GUI or by using the API, but only in CycloneDX format, Dependency-Track [does not support SPDX SBOMs](https://github.com/DependencyTrack/dependency-track/discussions/1222).
Support is [planned again](https://github.com/DependencyTrack/dependency-track/issues/1746) in the future, but depends on changes to the SPDX schema.
After the import, Dependency-Track analyzes them and generates lists of components and vulnerabilities.
Which vulnerabilities are recognized depends on the enabled analyzers and vulnerability sources.
By default the Docker deployment I used enabled the Internal Analyzer and the [Sonatype OSS Index](https://ossindex.sonatype.org/) as analyzers (even though [the FAQ says](https://docs.dependencytrack.org/FAQ/#i-expect-to-see-vulnerable-components-but-i-dont) OSS Index is disabled by default) and the [National Vulnerability Database (NVD)](https://nvd.nist.gov/) as data source.
The [best practices](https://docs.dependencytrack.org/best-practices/) recommend to additionally enable the [GitHub Advisory Database](https://github.com/advisories) as data source, which I did for later tests.

For the Juice Shop SBOM, without using the GitHub Advisory Database, Dependency Track finds 35 vulnerabilities in the Trivy SBOM and 83 in the one generated by Syft.
This is a pretty big difference, which has multiple reasons.
First of all, neither [Syft](https://github.com/anchore/syft/issues/931#issuecomment-1114405673) nor [Dependency-Track](https://github.com/DependencyTrack/dependency-track/issues/2151#issuecomment-1322415056) deduplicate packages, so each occurence of semver gets a new vulnerability entry for CVE-2022-25883.
Then again, only Syft's SBOMs contain CPEs, which are needed to find and match vulnerabilities in the NVD.

After enabling the GitHub Advisory Database, Dependency-Track reports 87 vulnerabilities for the Trivy SBOM, and 151 for Syft's.
It is not trivial to compare by which vulnerabilities this exactly differs, because they often have mutliple identifiers, which can lead to [the same vulnerability getting reported multiple times](https://github.com/DependencyTrack/dependency-track/issues/2181).
The counts of the severity categories also changed, but instead of strictly increasing there were more vulnerabilities of lower severity.

#### Others

As an OWASP project, Dependency-Track is a good first choice for an SBOM consumer and shows some of the problems which occur when building a complete SBOM workflow.
There are other tools with similar functionality as well, but at this point selecting the best tool is not necessary.
This is a collection of other possible tools that I did not test but which looked possibly fitting at a first glance, listed here as a reference.

The open source community [DevOps Kung Fu Mafia](https://github.com/devops-kung-fu) develops a tool called [bomber](https://github.com/devops-kung-fu/bomber).
Judging by the description it is very similar to Trivy or Grype, but instead of shipping or building their own combined vulnerability database, bomber directly checks vulnerabilities against either [OSV](https://osv.dev/), [OSS Index](https://ossindex.sonatype.org/) or [Snyk](https://security.snyk.io/).

The [FOSSLight Hub](https://github.com/fosslight/fosslight) lists SBOM support (SPDX only) and vulnerability management as capabilities.
Main usage and features seem to aim at license compliance though.

The Eclipse Foundation provides the software catalogue application [SW360](https://github.com/eclipse-sw360/sw360).
It [lists](https://projects.eclipse.org/projects/technology.sw360) vulnerability management as one of its features and supports both [SPDX](https://github.com/eclipse-sw360/sw360/pull/653) and [CycloneDX](https://github.com/eclipse-sw360/sw360/pull/2015) imports.
There is currently a [discussion](https://github.com/eclipse-sw360/sw360/discussions/2040) going on about using it as an SBOM management tool.

The [KubeClarity](https://github.com/openclarity/kubeclarity) tool by [OpenClarity](https://openclarity.io/) provides Kubernetes, container and filesystem scanning and vulnerability detection.
It uses a pluggable architecture to support multiple scanners and analyzers in a two step process with SBOMs as an intermediate product.
Currently used scanners are Trivy, Syft and Cyclonedx-gomod.
The analyzers are Trivy, Grype and Dependency-Track.

### The Naming Problem

As mentioned multiple times, one of the differences between Trivy's and Syft's SBOMs are the Common Package Enumerations (CPEs) that only Syft includes.
Among package urls (purls), they are a way of uniquely identifying software applications or packages, which is needed to match packages against vulnerabilities listed in a database.
While many databases already include purls as references, the National Vulnerability Database (NVD) does not.
This prevents the vulnerabilities, that are not duplicated to other databases ([like Debian's](https://github.com/DependencyTrack/dependency-track/issues/1827#issuecomment-1195181769)) to get reported.

So if including CPEs improves vulnerability matching, why does Trivy not include them?
Because CPEs are [difficult and inconvenient to work with](https://owasp.org/blog/2022/09/13/sbom-forum-recommends-improvements-to-nvd.html).
Accurately but automatically assigning the correct CPE is not trivial, because the format includes a vendor field, which does not always match the most trivial guess.
This fits closed source software distributed by companies, but not the modern OSS environment of small packages by individual contributors.
There is an official CPE dictionary, which __should__ be used to match components to CPEs, but even with that matching the correct software is not trivial.
For redis for example, it contains among others Anynines redis (`cpe:2.3:a:anynines:redis:2.1.2:*:*:*:*:pivotal_cloud_foundry:*:*`), a product using redis, hiredis (`cpe:2.3:a:redislabs:hiredis:0.14.0:*:*:*:*:*:*:*`), a C client, and the in-memory data store most people would think of (used to be `cpe:2.3:a:pivotal_software:redis:4.0.10:*:*:*:*:*:*:*` but is now `cpe:2.3:a:redislabs:redis:4.0.10:*:*:*:*:*:*:*`).
Since CPEs are centrally managed, they are often only assigned when a vulnerability is reported, so proactively monitoring for vulnerabilities turns into a guessing game.
This describes Syft's strategy of assigning CPEs pretty well, try to generate CPEs [on a best effort basis](https://github.com/anchore/syft/issues/268#issuecomment-741829842), which of course [fails sometimes](https://github.com/DependencyTrack/dependency-track/issues/1871#issuecomment-1208980821).
For Trivy there is an [open issue](https://github.com/aquasecurity/trivy-db/issues/113) to include CPEs, but it does not specifically mention SBOMs.

Because of these problems, [CPEs were already deprecated](https://groups.io/g/dependency-track/topic/74648781#129) by the NVD, with the intention of replacing them by Software Identification Tags (SWID) instead.
Since the migration is currently not moving along, [CycloneDX undeprecated CPEs](https://github.com/CycloneDX/specification/issues/105) again.

Package urls are a more recent naming scheme, which makes automatic assignment a lot easier.
Most other databases either directly support them already (like [OSS Index](https://ossindex.sonatype.org/doc/coordinates) or [Google's OSV](https://github.com/google/osv.dev/issues/64)), or contain the information needed to work with them (like GitHub advisories, but [including them is debated](https://github.com/github/advisory-database/issues/10)).
The most important one that does not is the NVD, which is why there are multiple requests and proposals for purls to get added.

This problem, that there is no unique identifier for software products that works across ecosystems, is known as the _naming problem_ among people working with SBOMs.
There are several proposals for fixing the status quo, which all boil down to "the NVD needs to use pulrs" for at least part of their solution.
The most iportant proposal is [_A Proposal to Operationalize Component Identification for Vulnerability Management_](https://owasp.org/assets/files/posts/A%20Proposal%20to%20Operationalize%20Component%20Identification%20for%20Vulnerability%20Management.pdf), released September last year by a group calling themselves the _SBOM Forum_.
In their statement, they also detail the problems of CPEs and propose using purls for identifying software, but other identifiers for hardware.
[Work is ongoing](https://tomalrichblog.blogspot.com/2023/06/dale-peterson-made-me-miss-dinner-again.html) to improve the NVD but it is a slow process.
Tom Alrich, the [founder of the SBOM Forum](https://securityboulevard.com/2023/03/making-sboms-useful/), regularly informs about updates [on his blog](https://tomalrichblog.blogspot.com/).

### Other Problems with SBOMs

Apart from the naming problem, SBOMs are still not the perfect solution for software composition analysis.
While SBOMs contain information about the software and version used, linux distributions often apply their own patches to the packages they distribute.
These patches regularly include backported fixes for security vulnerabilities as part of a distributions long term support commitments.
While getting this support is nice, it might lead to false positive vulnerability reports, because either the SBOM does not contain information about the specific distribution version of a package, or the vulnerability database it is matched against only contains information about fixes in the upstream version.

As an example, [according to the NVD](https://nvd.nist.gov/vuln/detail/CVE-2022-4450), `CVE-2022-4450` affects `openssl` starting with `1.1.1` and is fixed in `1.1.1t`.
The Debian advisory though [reports](https://security-tracker.debian.org/tracker/CVE-2022-4450), that a fix has been released for `1.1.1n-0+deb11u4`, which is the version used in the Juice Shop image.
Dependency-Track still reports the vulnerability though.
This means, that for accurate reports, the security advisories of the individual distributions would need to be considered as well, which further complicates the vulnerability mapping.
Dependency-Track has an [open issue](https://github.com/DependencyTrack/dependency-track/issues/1374) about this, so this problem is known as well, but the solution is not straight forward.

Another devil hides in the details: just because a dependency is included, this does not mean, that a vulnerability is actually exploitable through the application using it.
Depending on how deep in a dependency chain some library is included, it could range from trivial to impossible, to trigger the flaw at all.
The application or top-level library using the vulnerable dependency might not even use the affected feature.
SBOMs of course cannot judge that, they only inform about a component being present, which is the only information that consumption systems can rely on.

A possible solution for this problem is a [Vulnerability Exploitability eXchange (VEX)](https://www.cisa.gov/sites/default/files/2023-01/VEX_Use_Cases_Aprill2022.pdf), basically a standardized security advisory.
CycloneDX supports including vulnerability information, which can be used to [build VEX](https://cyclonedx.org/capabilities/vex/).
For applications, this can only be sensibly done by the vendor though, otherwise every consumer would need to individually analyze an application.
For this reason, Tom Alrich also [argues](https://tomalrichblog.blogspot.com/2023/08/playing-pro-ball-vs-keeping-score-at.html), that it would be better for vendors to do these analyses themselves and communicate it to all their users/customers, kind of how security advisories already work, but standardized and integrated into automatic tools.

## Related Content

Chainguard published a [blog post](https://www.chainguard.dev/unchained/a-purl-of-wisdom-on-sboms-and-vulnerabilities) about using _purls_ in SBOMs.
It includes a description of the naming problem and an analysis of Grype as container and SBOM scanner.
The goal was to conclude how many false positives could be eliminated by including purls in the generated SBOMs.
They conclude that around 50-60% could be avoided.

Joseph Hejderup and Henrik Plate compared different tools to generate SBOMs in a case study as part of their presentation [_In SBOMs We Trust: How Accurate, Complete, and Actionable Are They?_](https://fosdem.org/2023/schedule/event/sbom_survey/) at FOSDEM 2023.
They analyze three tools, two generic ones and one generating SBOMs at build-time, and take a more in-depth look at the details and accuracy of the generated SBOMs.
They anonymize the tools they used, but from the list of tools I found as possible options, I suspect that the two generic solutions are Trivy and Syft.

Another comparison of SBOM generation tools is included in Shubham Girdhar's master thesis [Identification of Software Bill of Materials in Container Images](https://www.researchgate.net/publication/363196266_Identification_of_Software_Bill_of_Materials_in_Container_Images).
He compares Syft, Tern, Trivy and [Dagda](https://github.com/eliasgranderubio/dagda), which is not an SBOM tool but a security scanner.

In their article [_A comparative study of vulnerability reporting by software composition analysis tools_](https://doi.org/10.1145/3475716.3475769) ([pdf freely available here](https://nasifimtiazohi.github.io/assets/pdf/esem21.pdf)), Imtiaz, Thorn, and Williams compare vulnerability reporting tools for software supply chain.
Instead of SBOM tools they evaluate OWASP Dependency-Check, Snyk, GitHub Dependabot, Maven Security Versions, npm audit, Eclipse Steady and three unnamed commercial tools.
Their results are very similar to my findings for SBOM workflows, the number of reported vulnerabilities varies a lot, vulnerabilities can be duplicated, and depend on the identifiers used.

Xia et al. released [_An Empirical Study on Software Bill of Materials: Where We Stand and the Road Ahead_](https://doi.org/10.1109/ICSE48619.2023.00219) this year.
In their study, they do not compare SBOM tools, but instead interview "SBOM practitioners" to assess how SBOMs are used today and how that could be improved.
One of their findings is the immaturity of SBOM consumption tools.
Although Dependency-Track is mentioned and used a few times, respondents felt, while it was user-friendly, it was not enterprise-ready.

Interlynk maintains an [SBOM benchmark](https://sbombenchmark.dev/).
They rank SBOMs by calculating their own [quality score](https://github.com/interlynk-io/sbomqs) for them.

For accurately including CPEs in SBOMs, open source mappings between CPEs and purls exist.
Both [SCANOSS](https://github.com/scanoss/purl2cpe) and [nexB](https://github.com/nexB/vulnerablecode-purl2cpe) maintain a dataset.

## Conclusions

Generating SBOMs from containers and automatically, regularly analyzing them for vulnerabilities works, but the results are not as accurate as one would hope.
Generating SBOMs during build time rather than from containers images helps, but is not a workflow we can rely on for the _secureCodeBox_.
Some of the problems, like the naming problem, will get better in the future, but the road there is long and the schedule unclear.

For the _secureCodeBox_, we decided to implement an MVP by using Trivy to generate CycloneDX SBOMs and sending them to Dependency-Track with a [persistence hook](https://www.securecodebox.io/docs/hooks).
Trivy is [already used](https://www.securecodebox.io/docs/scanners/trivy) in the _secureCodeBox_, which makes generating SBOMs and maintenance easier.
Syft SBOMs might be better because of their included CPEs, but they mostly matter for the OS packages of a container.
If we feel that SBOMs with CPEs are needed, and Trivy has not added that feature, we can still integrate Syft in the future.
The _secureCodeBox_ architecture prioritizes configurability and composability, so we are also looking into generating SPDX SBOMs in the future.
