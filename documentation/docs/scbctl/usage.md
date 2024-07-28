---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "How to use scbctl"
description: "Intro to the new secureCodeBox CLI tool"
sidebar_position: 3
---

## Key Commands

### `scbctl scan`: Creating Scans

Use the `scan` command to create a new Scan custom resource.
For it to work you need to have the scan type installed in the namespace you run the command for.

```bash
scbctl scan [scanType] -- [parameters...]
```

By default the scan command creates a scan with the same name as the scan type.
E.g. when creating a nmap scan, it will be called `nmap`. YOu can provide a custom name using the `--name` flag.

Examples:

- Create a basic nmap scan against `scanme.nmap.org`: `scbctl scan nmap -- scanme.nmap.org`
- Create a named scan: `scbctl scan nmap --name my-nmap-scan -- scanme.nmap.org`
- Multiple parameters: `scbctl scan nuclei -- -target example.com`
- Scan in a specific namespace: `scbctl scan --namespace testing nmap -- -p 80 scanme.nmap.org`

### `scbctl trigger`: Triggering ScheduledScans

To manually trigger a ScheduledScan.
This will create a new scan for the ScheduledScan.

```bash
scbctl trigger [scheduledScanName] [flags]
```

If the ScheduledScan is configured with an interval, e.g. every `4h`, the next interval is reset, so that the next scheduled execution will be in 4h from when the `scbctl trigger` command is executed.
If the ScheduledScan is configured using a cron expression the ScheduledScan will still be scheduled as usual when the cron expression next matches.

Examples:

- Trigger a scan: `scbctl trigger nmap-localhost`
- Trigger in a different namespace: `scbctl trigger nmap-localhost --namespace production`

## Tips for Effective Use

1. **Explore Help**: Use `scbctl --help` or `scbctl [command] --help` for detailed information about commands and flags.
2. **Namespace Awareness**: Always be mindful of which namespace you're operating in, especially in multi-tenant environments.
3. **Combining with kubectl**: While `scbctl` simplifies many operations, you may still need to use `kubectl` for more advanced Kubernetes operations.
4. **Automation**: Consider incorporating `scbctl` commands into scripts or CI/CD pipelines for automated security scanning.

By leveraging `scbctl`, you can streamline your interaction with secureCodeBox, making it easier to manage scans and scheduled scans in your Kubernetes environment.
