<!--
SPDX-FileCopyrightText: the secureCodeBox authors

SPDX-License-Identifier: Apache-2.0
-->
<!--
.: IMPORTANT! :.
--------------------------
This file is generated automatically with `helm-docs` based on the following template files:
- ./.helm-docs/templates.gotmpl (general template data for all charts)
- ./chart-folder/.helm-docs.gotmpl (chart specific template data)

Please be aware of that and apply your changes only within those template files instead of this file.
Otherwise your changes will be reverted/overwritten automatically due to the build process `./.github/workflows/helm-docs.yaml`
--------------------------
-->

<p align="center">
  <a href="https://opensource.org/licenses/Apache-2.0"><img alt="License Apache-2.0" src="https://img.shields.io/badge/License-Apache%202.0-blue.svg"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/releases/latest"><img alt="GitHub release (latest SemVer)" src="https://img.shields.io/github/v/release/secureCodeBox/secureCodeBox?sort=semver"/></a>
  <a href="https://owasp.org/www-project-securecodebox/"><img alt="OWASP Lab Project" src="https://img.shields.io/badge/OWASP-Lab%20Project-yellow"/></a>
  <a href="https://artifacthub.io/packages/search?repo=securecodebox"><img alt="Artifact HUB" src="https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/securecodebox"/></a>
  <a href="https://github.com/secureCodeBox/secureCodeBox/"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/secureCodeBox/secureCodeBox?logo=GitHub"/></a>
  <a href="https://twitter.com/securecodebox"><img alt="Twitter Follower" src="https://img.shields.io/twitter/follow/securecodebox?style=flat&color=blue&logo=twitter"/></a>
</p>

## What is OWASP secureCodeBox?

<p align="center">
  <img alt="secureCodeBox Logo" src="https://docs.securecodebox.io/img/Logo_Color.svg" width="250px"/>
</p>

_[OWASP secureCodeBox][scb-github]_ is an automated and scalable open source solution that can be used to integrate various *security vulnerability scanners* with a simple and lightweight interface. The _secureCodeBox_ mission is to support *DevSecOps* Teams to make it easy to automate security vulnerability testing in different scenarios.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The secureCodeBox project is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. It is also possible to start the different integrated security vulnerability scanners based on a docker infrastructure.

### Quickstart with secureCodeBox on kubernetes

You can find resources to help you get started on our [documentation website](https://docs.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://docs.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://docs.securecodebox.io/docs/getting-started/first-scans) with it.

## Supported Tags
- `latest`  (represents the latest stable release build)
- tagged releases, e.g. `v0.5.5`

## How to use this image
This `scanner` image is intended to work in combination with the corresponding `parser` image to parse the scanner `findings` to generic secureCodeBox results. For more information details please take a look at the [project page][scb-docs] or [documentation page][https://docs.securecodebox.io/docs/scanners/Whatweb].

```bash
docker pull securecodebox/scanner-whatweb
```

## What is WHATWEB?
Whatweb identifies the technologies used to build a website, such as content management systems (CMS), JavaScript libraries, web server and much more.
It has multiple aggression levels and depending on this level, whatweb may also report the version of specific technologies when an appropiate aggeression level was given. This makes whatweb especially interesting to use in a cascading-rules pipeline.

To learn more about the whatweb scanner itself visit [https://morningstarsecurity.com/research/whatweb](https://morningstarsecurity.com/research/whatweb), [GitHub repository](https://github.com/urbanadventurer/WhatWeb) or the [Wiki on Github](https://github.com/urbanadventurer/WhatWeb/wiki).

## Scanner Configuration

```bash
WhatWeb - Next generation web scanner version 0.5.5.
Developed by Andrew Horton (urbanadventurer) and Brendan Coles (bcoles)
Homepage: https://morningstarsecurity.com/research/whatweb

Usage: whatweb [options] <URLs>

TARGET SELECTION:
  <TARGETs>             Enter URLs, hostnames, IP addresses, filenames or
                        IP ranges in CIDR, x.x.x-x, or x.x.x.x-x.x.x.x
                        format.
  --input-file=FILE, -i Read targets from a file. You can pipe
                        hostnames or URLs directly with -i /dev/stdin.

TARGET MODIFICATION:
  --url-prefix          Add a prefix to target URLs.
  --url-suffix          Add a suffix to target URLs.
  --url-pattern         Insert the targets into a URL. Requires --input-file,
                        eg. www.example.com/%insert%/robots.txt

AGGRESSION:
  The aggression level controls the trade-off between speed/stealth and
  reliability.
  --aggression, -a=LEVEL Set the aggression level. Default: 1.
  Aggression levels are:
  1. Stealthy   Makes one HTTP request per target. Also follows redirects.
  3. Aggressive If a level 1 plugin is matched, additional requests will be
      made.
  4. Heavy      Makes a lot of HTTP requests per target. Aggressive tests from
      all plugins are used for all URLs.

HTTP OPTIONS:
  --user-agent, -U=AGENT Identify as AGENT instead of WhatWeb/0.5.5.
  --header, -H          Add an HTTP header. eg "Foo:Bar". Specifying a default
                        header will replace it. Specifying an empty value, eg.
                        "User-Agent:" will remove the header.
  --follow-redirect=WHEN Control when to follow redirects. WHEN may be `never`,
                        `http-only`, `meta-only`, `same-site`, or `always`.
                        Default: always.
  --max-redirects=NUM   Maximum number of contiguous redirects. Default: 10.

AUTHENTICATION:
  --user, -u=<user:password> HTTP basic authentication.
  --cookie, -c=COOKIES  Provide cookies, e.g. `name=value; name2=value2`.
  --cookiejar=FILE      Read cookies from a file.

PROXY:
  --proxy           <hostname[:port]> Set proxy hostname and port.
                    Default: 8080.
  --proxy-user      <username:password> Set proxy user and password.

PLUGINS:
  --list-plugins, -l            List all plugins.
  --info-plugins, -I=[SEARCH]   List all plugins with detailed information.
                                Optionally search with keywords in a comma
                                delimited list.
  --search-plugins=STRING       Search plugins for a keyword.
  --plugins, -p=LIST  Select plugins. LIST is a comma delimited set of
                      selected plugins. Default is all.
                      Each element can be a directory, file or plugin name and
                      can optionally have a modifier, eg. + or -
                      Examples: +/tmp/moo.rb,+/tmp/foo.rb
                      title,md5,+./plugins-disabled/
                      ./plugins-disabled,-md5
                      -p + is a shortcut for -p +plugins-disabled.

  --grep, -g=STRING|REGEXP      Search for STRING or a Regular Expression. Shows
                                only the results that match.
                                Examples: --grep "hello"
                                --grep "/he[l]*o/"
  --custom-plugin=DEFINITION\tDefine a custom plugin named Custom-Plugin,
  --custom-plugin=DEFINITION  Define a custom plugin named Custom-Plugin,
                        Examples: ":text=>'powered by abc'"
                        ":version=>/powered[ ]?by ab[0-9]/"
                        ":ghdb=>'intitle:abc \"powered by abc\"'"
                        ":md5=>'8666257030b94d3bdb46e05945f60b42'"
  --dorks=PLUGIN        List Google dorks for the selected plugin.

OUTPUT:
  --verbose, -v         Verbose output includes plugin descriptions. Use twice
                        for debugging.
  --colour,--color=WHEN control whether colour is used. WHEN may be `never`,
                        `always`, or `auto`.
  --quiet, -q           Do not display brief logging to STDOUT.
  --no-errors           Suppress error messages.

LOGGING:
  --log-brief=FILE        Log brief, one-line output.
  --log-verbose=FILE      Log verbose output.
  --log-errors=FILE       Log errors.
  --log-xml=FILE          Log XML format.
  --log-json=FILE         Log JSON format.
  --log-sql=FILE          Log SQL INSERT statements.
  --log-sql-create=FILE   Create SQL database tables.
  --log-json-verbose=FILE Log JSON Verbose format.
  --log-magictree=FILE    Log MagicTree XML format.
  --log-object=FILE       Log Ruby object inspection format.
  --log-mongo-database    Name of the MongoDB database.
  --log-mongo-collection  Name of the MongoDB collection. Default: whatweb.
  --log-mongo-host        MongoDB hostname or IP address. Default: 0.0.0.0.
  --log-mongo-username    MongoDB username. Default: nil.
  --log-mongo-password    MongoDB password. Default: nil. 
  --log-elastic-index     Name of the index to store results. Default: whatweb
  --log-elastic-host      Host:port of the elastic http interface. Default: 127.0.0.1:9200
 
PERFORMANCE & STABILITY:
  --max-threads, -t       Number of simultaneous threads. Default: 25.
  --open-timeout          Time in seconds. Default: 15.
  --read-timeout          Time in seconds. Default: 30.
  --wait=SECONDS          Wait SECONDS between connections.
                          This is useful when using a single thread.

HELP & MISCELLANEOUS:
  --short-help            Short usage help.
  --help, -h              Complete usage help.
  --debug                 Raise errors in plugins.
  --version               Display version information. (WhatWeb 0.5.5).

EXAMPLE USAGE:
* Scan example.com.
  ./whatweb example.com
* Scan reddit.com slashdot.org with verbose plugin descriptions.
  ./whatweb -v reddit.com slashdot.org
* An aggressive scan of wired.com detects the exact version of WordPress.
  ./whatweb -a 3 www.wired.com
* Scan the local network quickly and suppress errors.
  whatweb --no-errors 192.168.0.0/24
* Scan the local network for https websites.
  whatweb --no-errors --url-prefix https:// 192.168.0.0/24
* Scan for crossdomain policies in the Alexa Top 1000.
  ./whatweb -i plugin-development/alexa-top-100.txt \
  --url-suffix /crossdomain.xml -p crossdomain_xml
```

## Community

You are welcome, please join us on... 👋

- [GitHub][scb-github]
- [Slack][scb-slack]
- [Twitter][scb-twitter]

secureCodeBox is an official [OWASP][scb-owasp] project.

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

As with all Docker images, these likely also contain other software which may be under other licenses (such as Bash, etc from the base distribution, along with any direct or indirect dependencies of the primary software being contained).

As for any pre-built image usage, it is the image user's responsibility to ensure that any use of this image complies with any relevant licenses for all software contained within.

[scb-owasp]: https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]: https://docs.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
[whatweb]: https://morningstarsecurity.com/research/whatweb
