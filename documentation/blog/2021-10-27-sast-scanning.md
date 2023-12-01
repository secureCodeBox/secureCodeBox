---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Introducing SAST Scanning With secureCodeBox 3.3
author: Max Maass
author_title: Core Developer
author_url: https://github.com/malexmave
author_image_url: https://avatars.githubusercontent.com/u/1688580?v=4
tags:
  - secureCodeBox
  - SAST
  - cascading scans
  - case study
description: This post gives an introduction to using the new SAST functionality of secureCodeBox to find a malicious dependency
image: /img/blog/2021-10-27-magnifyingglass.jpg
---

![A magnifying glass pointed at a laptop keyboard](/img/blog/2021-10-27-magnifyingglass.jpg)

Cover photo by [Agence Olloweb](https://unsplash.com/@olloweb) on [Unsplash](https://unsplash.com/photos/d9ILr-dbEdg).

With _secureCodeBox_ 3.3, we have added several features that allow you to use _secureCodeBox_ for static application security testing (SAST).
This blog post gives an introduction to how several new features of _secureCodeBox_ 3.3 can be used to quickly run targeted SAST scans of your entire codebase.
By the end of this post, you will know how to build a SAST workflow to detect which of your repositories include a malicious dependency.
We will cover all steps of the process: obtaining a list of all software repositories in your organization, cloning and scanning them, and even dropping all of the results into a DefectDojo instance for later inspection.

<!--truncate-->

## Introduction

_secureCodeBox_ has been able to run dynamic security tests of your infrastructure for quite a while.
However, some issues are easier to catch by analyzing the source code of the applications directly.
This is the domain of static application security testing (SAST) tools, which detect dangerous code fragments and inform you long before they hit your production systems.
Normally, you would integrate these tools directly into your continuous integration (CI) workflows, so that the warnings reach the developers directly.
However, in some cases, you may also want to automatically analyze all repositories of your organization from a central location.
For example: You may want to find out which repositories use a specific API that you want to deprecate, check if any projects include a vulnerable ([or malicious][uaparser]) version of a library, or perform a variant analysis to determine if a newly detected critical security issue is present in other repositories.
In these cases, having your security team run a single, automated scan over all repositories can be easier than approaching every single development team individually.

## Case Study: Finding A Malicious Dependency

Let us imagine you are a security specialist at a software company. 
You wake up to the news that the popular JavaScript library [UA-parser-js was backdoored by attackers][uaparser].
Of course, you let your colleagues know immediately, but now you are wondering: is any of the software in our code repositories actually using the affected version of the library?
Let's find out!

In total, we need to perform three steps:
1. Identify all Git repositories in your organization.
2. Clone each repository and check if they are using an affected version of the library.
3. Make the results available for inspection.

### Finding All Git Repositories

For the purpose of this article, we will assume that you are using either GitHub or Gitlab to manage your source code repositories, and that you have (at the very least) read access to them.
If this is the case, you can use the existing [git-repo-scanner][gitreposcanner] to generate a list of all repositories in your organization.
For example, you can find all repositories under the secureCodeBox GitHub organization like this:

```yaml
apiVersion: "execution.securecodebox.io/v1"
kind: Scan
metadata:
  name: "scan-github"
spec:
  scanType: "git-repo-scanner"
  parameters:
    - "--git-type"
    - "github"
    - "--access-token"
    - "$(GITHUB_TOKEN)"
    - "--organization"
    - "secureCodeBox"
    - "--annotate-latest-commit-id"
    - "True"
  # The cascades here will be explained later
  cascades:
    matchLabels:
      securecodebox.io/intensive: medium
      securecodebox.io/invasive: non-invasive
  env:
    - name: GITHUB_TOKEN
      valueFrom:
        secretKeyRef:
          name: github-access-token
          key: token
```

This example assumes that you have created a GitHub [Personal Access Token][github-pat] with the `repo` scope and loaded it as a Kubernetes secret named `github-access-token`.
To do the latter, run:
```bash
# Don't forget the leading whitespace in the command to avoid 
# having your GitHub access token in your shell history!
 echo -n 'gh_abcdef...' > github-token.txt  # use -n to avoid trailing line break
kubectl create secret generic github-access-token --from-file=token=github-token.txt
rm github-token.txt
```

And that's it!
In this example, the scanner will automatically find all repositories under the secureCodeBox GitHub organization that you have access to, and generate a JSON output that looks something like this:

```json
[
  {
    "name": "GitHub Repo",
    "description": "A GitHub repository",
    "category": "Git Repository",
    "osi_layer": "APPLICATION",
    "severity": "INFORMATIONAL",
    "attributes": {
      "id": "292293538",
      "web_url": "https://github.com/secureCodeBox/documentation",
      "full_name": "secureCodeBox/documentation",
      "owner_type": "Organization",
      "owner_id": "34573705",
      "owner_name": "secureCodeBox",
      "created_at": "2020-09-02T13:39:10Z",
      "last_activity_at": "2021-10-26T11:23:25Z",
      "visibility": "public",
      "last_commit_id": "106a70b63fe9ffd6b2b264352331fc5e7d7821f0"
    },
    "id": "37c49e64-0f12-40ec-9e51-460d8b5e99f9",
    "parsed_at": "2021-10-26T14:19:42.707Z"
  },
  {
    "name": "GitHub Repo",
    "description": "A GitHub repository",
    "category": "Git Repository",
    "osi_layer": "APPLICATION",
    "severity": "INFORMATIONAL",
    "attributes": {
      "id": "80711933",
      "web_url": "https://github.com/secureCodeBox/secureCodeBox",
      "full_name": "secureCodeBox/secureCodeBox",
      "owner_type": "Organization",
      "owner_id": "34573705",
      "owner_name": "secureCodeBox",
      "created_at": "2017-02-02T09:48:05Z",
      "last_activity_at": "2021-10-26T11:44:02Z",
      "visibility": "public",
      "last_commit_id": "b16b0ddfbad578a35fe54100b9192165ac2f5c0c"
    },
    "id": "11b20733-eba5-47d7-b64d-09cf22bab29b",
    "parsed_at": "2021-10-26T14:19:42.707Z"
  },
  // And so on...
]
```

So, now that we have a list of repositories, how do we scan them?

### Creating Follow-Up Scans

[Cascading scans][cascadingscans] are probably one of the most useful features of _secureCodeBox_.
They allow you to use results from a previous scan to dynamically create targeted follow-up scans.
You can even include a selector to filter which results you want to act on, and which you want to ignore.
Consider the following cascading scan definition:

```yaml
apiVersion: "cascading.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "find-ua-parser-backdoor"
  # How invasive and resource intensive is this cascading scan?
  # Scans can use this to filter out specific CascadingRules (see the
  # 'cascades' definition in the example scan above)
  labels:
    securecodebox.io/invasive: non-invasive
    securecodebox.io/intensive: medium
spec:
  # Filter the results that the cascading scan should be run on.
  matches:
    anyOf:
      # Only run on GitHub repositories...
      - name: "GitHub Repo"
        # ...that are public
        # (Of course, you can remove this part if you also want
        # to scan private repositories)
        attributes:
          visibility: public
  scanSpec:
    # TODO: scanSpec will follow
```

This (incomplete) example of a cascading scan rule shows off some of their features: We can categorize how resource-intensive and invasive the defined scans are (so that the preceding scans can filter out specific cascading rules that are too invasive for the current engagement), and filter which results we want to act on.
In this example, we want to act on result with the name "GitHub Repo" that have an attribute called "visibility" that is set to "public".
Of course, we can drop the latter part if we also want to analyze private repositories.

So, this is all well and good, but how can we turn this into a SAST scan?
For this, we turn to the newest member in the family of _secureCodeBox_ scanners: semgrep.

### Detecting Affected Code

[Semgrep][semgrep] is an open source SAST scanner that we [added to secureCodeBox with the 3.3 release][semgrep-scb].
It has support for many popular programming languages and a [large corpus of pre-defined scan rules][semgrep-rules], but also allows you to [write your own rules][semgrep-write-rules] in a fairly intuitive and flexible syntax.
For example, this is a basic rule to find `package-lock.json` files that contain a reference to an affected version of the UA-parser-js library:

```yaml
rules:
- id: backdoored-ua-parser
  pattern-either:
    - pattern: |
        "ua-parser-js": { "version": "0.7.29", ... }
    - pattern: |
        "ua-parser-js": { "version": "0.8.0", ... }
    - pattern: |
        "ua-parser-js": { "version": "1.0.0", ... }
  paths:
    include:
      - package-lock.json
  message: Backdoored version of ua-parser-js found
  languages: [json]
  severity: ERROR
  metadata:
    references:
      - https://www.bleepingcomputer.com/news/security/popular-npm-library-hijacked-to-install-password-stealers-miners/
```

This rule will search through all `package-lock.json` files and look for any references to the affected versions of the library (of course, in practice you may want to refine this rule a bit more, but it is good enough for this example).
So, we have a rule, and we have a list of repositories - but how do we get the code from the repositories to where the scanner is?
By using another newly introduced feature of _secureCodeBox_: init containers.

### Getting The Code To The Scanner

If you already have some experience with Kubernetes, you may already know the concept of [init containers][initc].
Briefly, they are containers that are run before the main container of a job is run, and are used to provision specific data or configurations files for the main container.
With _secureCodeBox_ 3.2, we have [added support for init containers][initc-scb].
We can use this to provision the Git repository into the semgrep scan container, specifying a [shared volume between the init container and the main job][initc-volumes] so that they can share the downloaded data.
We can thus complete the cascading rule we began writing above.

```yaml
apiVersion: "cascading.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "find-ua-parser-backdoor"
  labels:
    securecodebox.io/invasive: non-invasive
    securecodebox.io/intensive: medium
spec:
  matches:
    anyOf:
      - name: "GitHub Repo"
        # Remove the the next two lines to scan all repositories,
        # or leave them to only scan public repositories
        attributes:
          visibility: public
  scanSpec:
    # We are scanining using semgrep
    scanType: "semgrep"
    # Specify an empty volume that we can share between scan and
    # init container
    volumes:
      - name: repo
        emptyDir: {}
    # Mount it on the scanner at /repo
    volumeMounts:
      - name: repo
        mountPath: "/repo/"
    parameters:
      # Reference the rule we created above in the semgrep playground: 
      # https://semgrep.dev/s/DzLd/
      # Of course, you can also specify a complete ruleset, like p/ci,
      # or place the rule in a YAML file using a Kubernetes secret or
      # ConfigMap.
      - "-c"
      - "s/DzLd"  
      # Disable the maximum scanned file size for semgrep, otherwise
      # very large package-lock.json files will be ignored
      - "--max-target-bytes 0"
      # Our code will be located at /repo/
      - "/repo/"
    # Specify the init container for cloning the code
    initContainers:
      - name: "git-clone"
        # Use a container with the git binary
        image: bitnami/git
        # We are assembling the git clone URL with HTTP authentication,
        # using the same personal access token as in the git-repo-scanner.
        # Note that using {{{triple braces}}} is important, as otherwise the
        # templating engine will automatically escape special characters and
        # break the URL.
        command:
          - git
          - clone
          - "https://$(GITHUB_TOKEN)@github.com/{{{attributes.full_name}}}"
          - /repo/
        # Specify that the "repo" volume should also be mounted on the 
        # initContainer
        volumeMounts:
          - mountPath: "/repo/"
            name: repo
        # Pull in the GitHub token from the secrets, as above
        env:
          - name: GITHUB_TOKEN
            valueFrom:
              secretKeyRef:
                name: github-access-token
                key: token
```

If you load this cascading rule and start the git-repo-scanner scan we defined above, it automatically starts scans for all repositories found by git-repo-scanner (make sure the [git-repo-scanner][gitreposcanner] and [semgrep][semgrep-scb] scantypes as well as the [CascadingScans hook][cascadingscans] are installed).
After waiting a while for the scan to finish, you can see the results using `kubectl get scans` - since we have a simple rule that only matches one specific vulnerability, any finding that is shown in the results should be investigated (find out which repository it belongs to by running `kubectl describe scan [name of the scan] | grep github.com`).
However, maybe you want to also inspect the data in an application security management system like [DefectDojo][defectdojo]?

### Getting The Results Into DefectDojo

_secureCodeBox_ has had a [DefectDojo integration][defectdojo-scb] for a while.
It allows you to automatically import data from your scans to DefectDojo, and optionally pull the results of the import back into _secureCodeBox_.
You can control how the imported data is assigned to products, engagements and tests in DefectDojo by using scan annotations, which also support templating for cascading scans.
For example, the following extended cascading scan definition now assigns each scan to a DefectDojo product for that repository, and also includes some version information.

```yaml
apiVersion: "cascading.securecodebox.io/v1"
kind: CascadingRule
metadata:
  name: "find-ua-parser-backdoor"
  labels:
    securecodebox.io/invasive: non-invasive
    securecodebox.io/intensive: medium
spec:
  # Add scan annotations for DefectDojo
  scanAnnotations:
    # Product type is "Git Repository"
    defectdojo.securecodebox.io/product-type-name: "Git Repository"
    # Name is the name of the repo (mind the triple braces!)
    defectdojo.securecodebox.io/product-name: "{{{ attributes.full_name }}}"
    # Add a few tags for easier indexing
    defectdojo.securecodebox.io/product-tags: git,github,repository,code
    # Denote that the scan belongs to an engagement that checks for
    # the presence of affected ua-parser-js versions
    defectdojo.securecodebox.io/engagement-name: "semgrep-ua-parser-js"
    # Add the latest commit ID as a version
    defectdojo.securecodebox.io/engagement-version: "{{ attributes.last_commit_id }}"
    # Name the specific test we performed by combining name and latest 
    # commit ID
    defectdojo.securecodebox.io/test-title: "{{{ attributes.full_name }}} - {{ attributes.last_commit_id }}"
  # ... rest of the definition as above, omitted for space
```

:::caution

If you want to try this in practice, note that it will currently only work if the DefectDojo hook is configured not to write back its results to _secureCodeBox_ (`--set="defectdojo.syncFindingsBack=false"` during installation of the hook).
Otherwise, the DefectDojo hook will overwrite the findings of the git-repo-scanner job, causing the cascading jobs not to be run.
Also note that at the time of writing, the current version of DefectDojo has a [known issue with the semgrep importer being a bit too aggressive with deduplication][defectdojo-semgrep-issue], which should be fixed in the next release (but should not affect this example).
:::

Of course, we also want to help you follow security best practices in your security scanning infrastructure, so starting with _secureCodeBox_ 3.3, you can also run the DefectDojo hook with an API key with limited permissions instead of the full administrative access that was previously required.
For more details, see the [DefectDojo Hook Documentation][defectdojo-scb-permissions].

## Conclusion

We hope this example shows how SAST scans can be a valuable addition to your secureCodeBox toolbelt, even if you are already using such scanners as part of the CI pipeline.
Of course, nothing stops you from using [scheduled scans][scheduledscans] to keep re-running these scans on a regular basis to check for additional issues like [leaked secrets][semgrep-secrets] (which is also possible with [gitleaks][gitleaks]) or [high-confidence security issues][semgrep-ci] in your repositories, just to make sure the existing processes did not miss anything.
As always, our goal is to provide a platform that works with your workflows instead of prescribing our own.
We are looking forward to hearing your own stories and ideas for using secureCodeBox - [OWASP Slack](https://owasp.org/slack/invite) (Channel `#project-securecodebox`) or [GitHub][scb-repo] to get in touch.


[uaparser]: https://www.bleepingcomputer.com/news/security/popular-npm-library-hijacked-to-install-password-stealers-miners/
[semgrep]: https://semgrep.dev
[semgrep-rules]: https://semgrep.dev/r
[semgrep-scb]: /docs/scanners/semgrep
[semgrep-write-rules]: https://semgrep.dev/learn/
[semgrep-secrets]: https://semgrep.dev/p/secrets
[semgrep-ci]: https://semgrep.dev/p/ci
[defectdojo]: https://www.defectdojo.org/
[defectdojo-semgrep-issue]: https://github.com/DefectDojo/django-DefectDojo/pull/5317
[defectdojo-scb]: /docs/hooks/defectdojo
[defectdojo-scb-permissions]: /docs/hooks/defectdojo#low-privileged-mode
[initc]: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/
[initc-volumes]: https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-initialization/#create-a-pod-that-has-an-init-container
[initc-scb]: /docs/api/crds/scan#initcontainers-optional
[github-pat]: https://github.com/settings/tokens
[gitreposcanner]: /docs/scanners/git-repo-scanner
[cascadingscans]: /docs/hooks/cascading-scans
[scheduledscans]: /docs/how-tos/automatically-repeating-scans
[gitleaks]: /docs/scanners/gitleaks
[scb-repo]: https://github.com/secureCodeBox/secureCodeBox/