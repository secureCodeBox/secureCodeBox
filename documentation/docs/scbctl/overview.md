---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "scbctl overview"
description: "Intro to the new secureCodeBox CLI tool"
sidebar_position: 1
---

# scbctl Project Overview

scbctl is a command-line interface (CLI) tool designed to simplify interactions with secureCodeBox Operator. 

## Purpose

The main purpose of scbctl is to provide an easier way to manage secureCodeBox CustomResources in Kubernetes, reducing the complexity of using kubectl and helm for common secureCodeBox operations.

## Key Features

1. **Scan Creation**
   - Easily create new Scan custom resources
   - Support for various scan types and parameters

2. **ScheduledScan Management**
   - Trigger ScheduledScans manually ahead of their schedule

3. **Namespace Support**
   - Operate across different Kubernetes namespaces

4. **Custom Naming**
   - Assign custom names to scans for better organization

5. **Shell Completion**
   - Offers completion support for easier command usage

## Main Commands

1. `scan`: Create a new Scan custom resource
   ```
   scbctl scan [scanType] -- [parameters...]
   ```

2. `trigger`: Trigger a ScheduledScan execution
   ```
   scbctl trigger [scheduledScanName] [flags]
   ```

## Installation

```bash
git clone https://github.com/secureCodeBox/secureCodeBox.git
make scbctl
sudo mv scbctl/scbctl /usr/local/bin/scbctl
```

## Use Cases

1. **Quick Scan Creation**: Rapidly initiate security scans without writing YAML files
2. **CI/CD Integration**: Easily incorporate security scanning into automated pipelines
3. **Manual Triggering**: Allows operators to run ScheduledScans on-demand
4. **Cross-Namespace Operations**: Manage scans across different Kubernetes namespaces

## Benefits

1. **Simplicity**: Reduces the learning curve for managing secureCodeBox resources
2. **Efficiency**: Streamlines common tasks, saving time for operators
3. **Flexibility**: Supports various scan types and configurations
4. **Integration**: Can be easily incorporated into scripts and automation workflows


## Future Directions

1. Support scans monitoring
2. Support direct installation on MacOS/Windows/Linux 
3. Support other commands for scheduledscans creation

