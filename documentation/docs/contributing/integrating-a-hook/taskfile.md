---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: Taskfile
sidebar_position: 4
---

To test your hook locally, you'll use a Taskfile.yaml configuration. The secureCodeBox project has migrated from Makefiles to [Task](https://taskfile.dev/) for better maintainability and cross-platform support.

## Basic Hook Taskfile

Create a `Taskfile.yaml` in your hook directory with the following content:

```yaml
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

version: "3"

includes:
  hook:
    taskfile: ../Taskfile.yaml
    flatten: true
    vars:
      hookName: your-hook-name  # Replace with your hook's name

tasks: {}
```

This minimal configuration includes all the common tasks defined in the parent Taskfile and sets your hook name as a variable.

## Available Tasks

| Task                   | Description                                                                |
|------------------------|----------------------------------------------------------------------------|
| build                  | Builds your hook                                                           |
| deploy                 | Deploys your hook helm chart into your local kind cluster                  |
| predeploy              | Can be overridden to perform any pre-deployment steps                      |
| test:unit              | Run your hook unit tests                                                   |
| test:integration       | Run integration tests for your hook                                        |
| test:helm              | Run helm tests for your hook                                               |
| test                   | Run all tests (unit, helm, and integration)                                |

## Running Tests

To run tests for your hook, you can use the following commands:

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

You can add custom tasks specific to your hook by defining them in the `tasks` section:

```yaml
tasks:
  custom-task:
    desc: "My custom task description"
    cmds:
      - echo "Running custom task for my hook"
```

### Customizing Deployment

If you need to customize the deployment process, you can override the `predeploy` task:

```yaml
tasks:
  predeploy:
    desc: "Prepare environment for hook deployment"
    cmds:
      - kubectl create namespace my-hook-tests --dry-run=client -o yaml | kubectl apply -f -
      - helm -n my-hook-tests upgrade --install juice-shop ../../demo-targets/juice-shop/ --wait
```

### Adding Test Dependencies (demo-targets)

To add test dependencies, you can create a custom task that runs before the integration tests:

```yaml
tasks:
  deploy-test-deps:
    desc: "Deploy test dependencies for my hook"
    cmds:
      - task: demo-targets:deploy-http-webhook
      - task: demo-targets:deploy-test-scan
```

### Changing the Unit Test Language

If your hook is written in a language other than JavaScript, you can customize the test:unit task:

```yaml
tasks:
  test:unit:
    desc: "Run Java unit tests for my hook"
    cmds:
      - cd {{ .TASKFILE_DIR }}/{{ .hookName }}/hook && ./gradlew test
```

## Testing Environment Setup

Before running integration tests, make sure you have set up the testing environment:

```bash
# From the project root directory
task prepare-testing-env
```

This will create a kind cluster and deploy the secureCodeBox operator.