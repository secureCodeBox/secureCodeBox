---
# SPDX-FileCopyrightText: the secureCodeBox authors
#
# SPDX-License-Identifier: Apache-2.0

title: 'Streamlining Security Scans with secureCodeBox: My Google Summer of Code Journey'
author: Thibaut Batale
author_title: Gsoc'24 Contributor
author_url: https://github.com/Freedisch
author_image_url: https://avatars.githubusercontent.com/u/82499435?s=96&v=4
tags:
  - Google summer of code
  - scbctl
  - secureCodeBox
  - community
  - open source
description: This post gives some insights about the Google summer of code work with secureCodeBox.
image: /img/blog/2024-08-20-gsoc.png
---

![Notes](/img/blog/2024-08-20-gsoc.png)

---

Hey there, I’m Thibaut Batale, and I’m thrilled to share my experience as a Google Summer of Code contributor with OWASP secureCodeBox. Being selected to participate in this program was a unique opportunity, but what excited me the most was being chosen for the very first project I applied to. I wanted to spend this summer battling with Kubernetes, and I got exactly what I wished for—and more.

If you’re curious about my contributions during GSoC 2024, you can check out my [Pull Requests](https://github.com/secureCodeBox/secureCodeBox/pulls?q=is:pr+author:Freedisch+is:closed) on GitHub. You can also find more details about my project by visiting the [Project link](https://summerofcode.withgoogle.com/programs/2024/projects/vFuhwP9m).



### My Project:  Introducing the secureCodeBox CLI

Imagine this scenario: You want to assess your security environment by testing for various vulnerabilities. With secureCodeBox, you can launch multiple security tests. However, traditionally, you would first need to create a YAML file defining the scan parameters and then use the `kubectl` command to apply that file. This process can be tedious and time-consuming, especially if you’re managing multiple scans.

This is where the `scbctl` CLI comes in. By providing a set of commands that interact directly with the secureCodeBox operator, the CLI tool simplifies and streamlines the process of managing security scans, making it more efficient and user-friendly.

During the summer, I focused on two main goals: implementing the new commands and adding unit tests to ensure their reliability.

### Commands Technical Implementation

The commands implementation essential follows this workflow

![workflow](/img/blog/2024-08-20-workflow.png).

#### **1. Create Scan Command (`scbctl scan`)**

The `scbctl scan` command was designed to simplify the initiation of new security scans. Instead of manually creating a YAML file and applying it with `kubectl`, users can now start a scan directly from their terminal. This command interacts with the secureCodeBox operator by creating a `Scan` custom resource (CR) in the specified namespace. The operator then processes this CR, triggering the appropriate scanner to run the specified tests.

**Usage Example:**
```bash
scbctl scan nmap -- scanme.nmap.org
```
This command creates a new Nmap scan targeting `scanme.nmap.org`.

**Output:**
```bash
🆕 Creating a new scan with name 'nmap' and parameters 'scanme.nmap.org'
🚀 Successfully created a new Scan 'nmap'
```

#### **2. Observe Scan Command (`scbctl scan --follow`)**

The `--follow` flag enhances the `scbctl scan` command by providing real-time feedback on the progress of a scan. Once a scan is initiated, users can observe its progress directly from their terminal. This feature interacts with the secureCodeBox operator by streaming logs from the Kubernetes Job and Pods associated with the scan, giving users visibility into the scan’s status and results as they happen.

**Usage Example:**
```bash
scbctl scan nmap --follow -- scanme.nmap.org
```
This command initiates a scan and follows its progress in real-time.

**Output:**
```bash
Found 1 job(s)
Job: scan-nmap-jzmtq, Labels: map[securecodebox.io/job-type:scanner]
scan-nmap-jzmtq📡 Streaming logs for job 'scan-nmap-jzmtq' and container 'nmap'
Starting Nmap 7.95 ( https://nmap.org ) at 2024-08-23 11:59 UTC
Nmap scan report for scanme.nmap.org (45.33.32.156)
Host is up (0.33s latency).
Other addresses for scanme.nmap.org (not scanned): 2600:3c01::f03c:91ff:fe18:bb2f
Not shown: 996 closed tcp ports (conn-refused)
PORT      STATE    SERVICE
22/tcp    open     ssh
80/tcp    filtered http
9929/tcp  open     nping-echo
31337/tcp open     Elite

Nmap done: 1 IP address (1 host up) scanned in 30.19 seconds
```

#### **3. Trigger Scan Command (`scbctl trigger`)**

The `scbctl trigger` command allows users to manually trigger a `ScheduledScan` resource. Scheduled scans are designed to run at predefined intervals, but there are times when an immediate execution is required. This command interacts with the secureCodeBox operator by invoking the `ScheduledScan` resource and creating a new `Scan` based on the schedule’s configuration.

**Usage Example:**
```bash
scbctl trigger nmap --namespace foobar
```
This command triggers the `nmap` scheduled scan immediately.

**Output:**
```bash
triggered new Scan for ScheduledScan 'nmap'
```

#### **4. Cascade Visualization Command (`scbctl cascade`)**

The `scbctl cascade` command provides a visualization of cascading scans—scans that are automatically triggered based on the results of a previous scan. This command interacts with the secureCodeBox operator by querying all `Scan` resources in a given namespace and identifying relationships based on the `ParentScanAnnotation`. It then generates a hierarchical tree that visually represents these cascading relationships.

**Usage Example:**
```bash
scbctl cascade
```
This command visualizes the cascading relationships between scans in the current namespace.

**Output:**
```bash
Scans
├── initial-nmap-scan
│   ├── follow-up-vulnerability-scan
│   │   └── detailed-sql-injection-scan
└── another-initial-scan
    └── another-follow-up-scan
```

### Test Coverage Implementation

Testing was a crucial part of the development process, especially considering the complexity of the CLI commands and their interactions with the secureCodeBox (SCB) operator. Achieving an overall test coverage of 78% involved writing extensive unit tests that validated the behavior of each command and ensured they interacted correctly with the Kubernetes resources.

#### Mocking the Kubernetes Client

To simulate the Kubernetes environment and test the SCB commands without deploying them on an actual cluster, I used the `fake.Client` from the `controller-runtime` library. This allowed me to create a mock client that mimicked the behavior of the Kubernetes API, enabling thorough testing of the command interactions.

Here’s an example of a test case for the `scbctl scan` command:

```go
testcases := []testcase{
    {
        name:          "Should create nmap scan with a single parameter",
        args:          []string{"scan", "nmap", "--", "scanme.nmap.org"},
        expectedError: nil,
        expectedScan: &expectedScan{
            name:       "nmap",
            scanType:   "nmap",
            namespace:  "default",
            parameters: []string{"scanme.nmap.org"},
        },
    },
    // Additional test cases...
}
```

In this test, I defined different scenarios to validate the command's behavior. Each test case included the expected arguments, any expected errors, and the expected state of the scan resource after execution.

#### Testing Command Behavior

The tests focused on validating that the CLI commands correctly created the necessary Kubernetes resources, such as `Scan` objects. For example, the `scbctl scan` command was tested to ensure it created a scan with the correct type, parameters, and namespace:

```go
if tc.expectedScan != nil {
    scans := &v1.ScanList{}
    listErr := client.List(context.Background(), scans)
    assert.Nil(t, listErr, "failed to list scans")
    assert.Len(t, scans.Items, 1, "expected 1 scan to be created")

    scan := scans.Items[0]
    assert.Equal(t, tc.expectedScan.name, scan.Name)
    assert.Equal(t, tc.expectedScan.namespace, scan.Namespace)
    assert.Equal(t, tc.expectedScan.scanType, scan.Spec.ScanType)
    assert.Equal(t, tc.expectedScan.parameters, scan.Spec.Parameters)
}
```

This code snippet checks that the correct `Scan` object was created in the Kubernetes cluster, verifying that the CLI command worked as intended.

By running these tests and implementing these scenarios, I ensured that the `scbctl` tool behaved as expected under various conditions, contributing to the robustness of the secureCodeBox CLI tool.


### Challenges

This summer wasn’t without its challenges. Balancing time became difficult when my school resumed, and I encountered several technical hurdles along the way. The most notable was implementing the `--follow` flag. Initially, we used the controller-runtime, but it lacked the necessary support for streaming logs. We considered switching to the `go-client`, but it introduced inconsistencies that could delay the project. After extensive discussions with my mentor [Jannik Hollenbach](https://github.com/J12934), we decided to defer this feature for future implementation. This experience taught me the importance of thorough research and adaptability in problem-solving.


### Overall Experience and Future Prospects

One of the most rewarding aspects of working on this project was the continuous learning curve. Whether diving into the complexities of the codebase or exploring the broader capabilities of secureCodeBox, there was always something new to discover. This constant evolution is what made the project so fascinating for me.

As the project reaches completion, maintaining and building upon these efforts is crucial. Looking ahead, I plan to focus on integrating monitoring features using the `controller-runtime` whenever its available, which will enhance the tool's ability to provide real-time feedback. Additionally, I aim to refine existing commands, particularly the `cascade` command, by adding flags to display the status of each scanner. This will provide users with more detailed insights into their scans. My commitment to improving and maintaining the project will ensure its continued success and relevance in the future.

---
