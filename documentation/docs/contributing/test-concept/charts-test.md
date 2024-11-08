---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: "Helm Charts Testing"
sidebar_position: 5
---

## Helm charts

Helm charts simplify Kubernetes app management but can be complex to configure correctly. Testing Helm charts ensures templates render as expected, minimizing deployment errors and enhancing reliability. That is, since it allows for catching misconfigurations early and detecting regressions.


## Testing Framework: helm-unittest
[helm-unittest](https://github.com/helm-unittest/helm-unittest.git) is a BDD-style testing framework for Helm charts, offering YAML-based test definitions, local rendering, and snapshot testing.

**Installation**:
```bash
helm plugin install https://github.com/helm-unittest/helm-unittest.git
```

## Writing Tests with helm-unittest

Currently, we use Snapshot Testing to verify the correctness of the rendered manifests. This is done by comparing the rendered manifests with a snapshot of the expected manifests.


### Example Test Cases

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="Test Case" label="Test Case" default>
```yaml
suite: Full Snapshot
tests:
  - it: matches the snapshot
    chart:
      version: 0.0.0
      appVersion: 0.0.0      
    set:
      cascadingRules.enabled: true
      imagePullSecrets: [{name: foo}]
      parser:
        env: [{name: foo, value: bar}]
        scopeLimiterAliases: {foo: bar}
        affinity: {foo: bar}
        tolerations: [{foo: bar}]
        resources: {foo: bar}
      scanner:
        nameAppend: foo
        resources: {foo: bar}
        env: [{name: foo, value: bar}]
        extraContainers: [{name: foo, image: bar}]
        podSecurityContext: {fsGroup: 1234}
        affinity: {foo: bar}
        tolerations: [{foo: bar}]
    asserts:
      - matchSnapshot: {}
```
  </TabItem>

<TabItem value="Snapshot" label="Snapshot">

```
matches the snapshot:
  1: |
    apiVersion: cascading.securecodebox.io/v1
    kind: CascadingRule
    metadata:
      labels:
        securecodebox.io/intensive: light
        securecodebox.io/invasive: non-invasive
      name: doggo-dnsscan
    spec:
      matches:
        anyOf:
          - category: Subdomain
            osi_layer: NETWORK
      scanSpec:
        parameters:
          - '{{location}}'
          - A
          - AAAA
          - NS
          - CNAME
          - TXT
          - MX
          - SRV
        scanType: doggo
  2: |
    apiVersion: execution.securecodebox.io/v1
    kind: ParseDefinition
    metadata:
      name: doggo-json
    spec:
      affinity:
        foo: bar
      env:
        - name: foo
          value: bar
      image: docker.io/securecodebox/parser-doggo:0.0.0
      imagePullPolicy: IfNotPresent
      imagePullSecrets:
        - name: foo
      resources:
        foo: bar
      scopeLimiterAliases:
        foo: bar
      tolerations:
        - foo: bar
      ttlSecondsAfterFinished: null
  3: |
    apiVersion: execution.securecodebox.io/v1
    kind: ScanType
    metadata:
      name: doggofoo
    spec:
      extractResults:
        location: /home/securecodebox/doggo-results.json
        type: doggo-json
      jobTemplate:
        spec:
          backoffLimit: 3
          suspend: false
          template:
            spec:
              affinity:
                foo: bar
              containers:
                - command:
                    - sh
                    - /wrapper.sh
                  env:
                    - name: foo
                      value: bar
                  image: docker.io/securecodebox/scanner-doggo:0.0.0
                  imagePullPolicy: IfNotPresent
                  name: doggo
                  resources:
                    foo: bar
                  securityContext:
                    allowPrivilegeEscalation: false
                    capabilities:
                      drop:
                        - all
                    privileged: false
                    readOnlyRootFilesystem: true
                    runAsNonRoot: true
                  volumeMounts: []
                - image: bar
                  name: foo
              restartPolicy: OnFailure
              securityContext:
                fsGroup: 1234
              tolerations:
                - foo: bar
              volumes: []

```
  </TabItem>
</Tabs>


### Running Tests

In the helm-chart folder, run tests with:
```bash
make helm-unit-tests
```
or 
```bash
helm unittest .
```
And review the output for any failures.

The `make` command will also run inside the Operator, AutoDiscovery, Scanners, Hooks or Demo-Targets root folders and tests all the Helm Charts in the corresponding folder. 

## CI/CD Integration

The Helm charts tests are integrated into the CI/CD pipeline. Operator, AutoDiscovery, Scanners, Hooks and Demo-Targets Charts are tested. The tests are run automatically on every pull request and merge to the main branch. See the [CI/CD Pipeline](https://github.com/secureCodeBox/secureCodeBox/blob/main/.github/workflows/ci.yaml) for reference.
