---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "How to use scbctl"
description: "Intro to the new secureCodeBox CLI tool"
sidebar_position: 4
---

# Using scbctl - CLI for secureCodeBox

`scbctl` is a command-line interface tool designed to simplify interactions with secureCodeBox CustomResources like Scans and ScheduledScans. It provides an easier alternative to using `kubectl` and `helm` for certain operations.

## Installation

To install `scbctl`:

1. Clone the secureCodeBox repository:
   ```bash
   git clone https://github.com/secureCodeBox/secureCodeBox.git
   ```

2. Build the tool:
   ```bash
   make scbctl
   ```

3. Move the binary to a directory in your PATH:
   ```bash
   cd scbctl
   sudo mv scbctl /usr/local/bin/scbctl
   ```

## Key Commands

### Creating a Scan

Use the `scan` command to create a new Scan custom resource:

```bash
scbctl scan [scanType] -- [parameters...]
```

Examples:
- Basic scan: `scbctl scan nmap -- scanme.nmap.org`
- Named scan: `scbctl scan nmap --name my-nmap-scan -- scanme.nmap.org`
- Multiple parameters: `scbctl scan nuclei -- -target example.com`
- Scan in a specific namespace: `scbctl scan --namespace testing nmap -- -p 80 scanme.nmap.org`

### Triggering a ScheduledScan

To manually trigger a ScheduledScan:

```bash
scbctl trigger [scheduledScanName] [flags]
```

Examples:
- Trigger a scan: `scbctl trigger nmap-localhost`
- Trigger in a different namespace: `scbctl trigger nmap-localhost --namespace production`

## Additional Features

1. **Namespace Selection**: Most commands support a `--namespace` flag to specify the Kubernetes namespace.

2. **Custom Naming**: You can provide custom names for scans using the `--name` flag with the `scan` command.

3. **Shell Completion**: `scbctl` offers shell completion to make command usage easier. Use `scbctl completion --help` for setup instructions.

## Tips for Effective Use

1. **Explore Help**: Use `scbctl --help` or `scbctl [command] --help` for detailed information about commands and flags.

2. **Namespace Awareness**: Always be mindful of which namespace you're operating in, especially in multi-tenant environments.

3. **Combining with kubectl**: While `scbctl` simplifies many operations, you may still need to use `kubectl` for more advanced Kubernetes operations.

4. **Automation**: Consider incorporating `scbctl` commands into scripts or CI/CD pipelines for automated security scanning.
