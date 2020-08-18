---
title: "ZAP"
path: "scanners/zap"
category: "scanner"
type: "WebApplication"
state: "released"
appVersion: "2.9.0"
usecase: "WebApp & OpenAPI Vulnerability Scanner"
---

![zap logo](https://raw.githubusercontent.com/wiki/zaproxy/zaproxy/images/zap32x32.png)

The OWASP Zed Attack Proxy (ZAP) is one of the world’s most popular free security tools and is actively maintained by hundreds of international volunteers*. It can help you automatically find security vulnerabilities in your web applications while you are developing and testing your applications. Its also a great tool for experienced pentesters to use for manual security testing.

To learn more about the ZAP scanner itself visit [OWASP_Zap_Project] or [zaproxy.org].

<!-- end -->

## Configuration

The following security scan configuration example are based on the [ZAP Documentation], please take a look at the original documentation for more configuration examples.

The command line interface can be used to easily run server scans: `-t www.example.com`

```bash
Usage: zap-baseline.py -t <target> [options]
    -t target         target URL including the protocol, eg https://www.example.com
Options:
    -h                print this help message
    -c config_file    config file to use to INFO, IGNORE or FAIL warnings
    -u config_url     URL of config file to use to INFO, IGNORE or FAIL warnings
    -g gen_file       generate default config file (all rules set to WARN)
    -m mins           the number of minutes to spider for (default 1)
    -r report_html    file to write the full ZAP HTML report
    -w report_md      file to write the full ZAP Wiki (Markdown) report
    -x report_xml     file to write the full ZAP XML report
    -J report_json    file to write the full ZAP JSON document
    -a                include the alpha passive scan rules as well
    -d                show debug messages
    -P                specify listen port
    -D                delay in seconds to wait for passive scanning
    -i                default rules not in the config file to INFO
    -I                do not return failure on warning
    -j                use the Ajax spider in addition to the traditional one
    -l level          minimum level to show: PASS, IGNORE, INFO, WARN or FAIL, use with -s to hide example URLs
    -n context_file   context file which will be loaded prior to spidering the target
    -p progress_file  progress file which specifies issues that are being addressed
    -s                short output format - dont show PASSes or example URLs
    -T                max time in minutes to wait for ZAP to start and the passive scan to run
    -z zap_options    ZAP command line options e.g. -z "-config aaa=bbb -config ccc=ddd"
    --hook            path to python file that define your custom hooks
```

[SSLyze GitHub]: https://github.com/nabla-c0d3/sslyze
[SSLyze Documentation]: https://nabla-c0d3.github.io/sslyze/documentation/
