---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Taskfile
sidebar_position: 4
---

To test your scanner locally, you'll use a Taskfile.yaml configuration. The secureCodeBox project has migrated from Makefiles to [Task](https://taskfile.dev/) for better maintainability and cross-platform support.

## Basic Scanner Taskfile

Create a `Taskfile.yaml` in your scanner directory with the following content:

```yaml
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

version: "3"

includes:
  scanner:
    taskfile: ../Taskfile.yaml
    flatten: true
    vars:
      scannerName: your-scanner-name  # Replace with your scanner's name

tasks: {}
```

This minimal configuration includes all the common tasks defined in the parent Taskfile and sets your scanner name as a variable.

## Available Tasks

| Task                   | Description                                                                |
|------------------------|----------------------------------------------------------------------------|
| build                  | Builds your parser (& scanner if custom scanner is defined)                |
| deploy                 | Deploys your scanner helm chart into your local kind cluster               |
| predeploy              | Can be overridden to perform any pre-deployment steps                      |
| test:unit              | Run your parser unit tests                                                 |
| test:integration       | Run integration tests for your scanner                                     |
| test:helm              | Run helm tests for your scanner                                            |
| test                   | Run all tests (unit, helm, and integration)                                |

## Running Tests

To run tests for your scanner, you can use the following commands:

```bash
# Run only unit tests
task test:unit

# Run only integration tests
task test:integration

# Run only helm unit tests
task test:helm

# Run all tests (unit, helm, and integration)
task test
```

## Customizing Your Taskfile

### Adding Custom Tasks

You can add custom tasks specific to your scanner by defining them in the `tasks` section:

Generally we try to keep all the tasks for scanner and hooks standardized for easier maintenance.

```yaml
tasks:
  custom-task:
    desc: "My custom task description"
    cmds:
      - echo "Running custom task for my scanner"
```

### Customizing Deployment

If you need to customize the deployment process, you can override the `predeploy` task:

```yaml
tasks:
  predeploy:
    desc: "Prepare environment for scanner deployment"
    cmds:
      - kubectl apply -f ./integration-tests/configmap-wordlist.yaml -n integration-tests
```

### Adding Test Dependencies

To add test dependencies (demo-targets), you can call the demo-target deploy tasks which are automatically available.

```yaml
tasks:
  predeploy:
    desc: "Prepare environment for scanner deployment"
    deps:
      - demo-targets:deploy:bodgeit
      - demo-targets:deploy:juice-shop
      # see demo-targets/Taskfile.yaml for all available demo targets. (the task needs to be prefixed here with the `demo-target:` namespace)
```

### Overriding Helm Deploy Configurations

You can customize the Helm deployment by setting additional variables:

```yaml
includes:
  scanner:
    taskfile: ../Taskfile.yaml
    flatten: true
    vars:
      scannerName: my-scanner
      additionalHelmInstallArgsForScanner: |
        --set="helmValue.enabled=false" \ # needs to end in a backslash as its inserted into a multi line bash 
```

## Testing Environment Setup

Before running integration tests, make sure you have set up the testing environment:

```bash
# From the project root directory
task prepare-testing-env
```

This will create a kind cluster and deploy the secureCodeBox operator.