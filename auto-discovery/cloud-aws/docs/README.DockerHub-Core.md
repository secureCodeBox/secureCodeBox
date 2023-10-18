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
  <img alt="secureCodeBox Logo" src="https://www.securecodebox.io/img/Logo_Color.svg" width="250px"/>
</p>

_[OWASP secureCodeBox][scb-github]_ is an automated and scalable open source solution that can be used to integrate various *security vulnerability scanners* with a simple and lightweight interface. The _secureCodeBox_ mission is to support *DevSecOps* Teams to make it easy to automate security vulnerability testing in different scenarios.

With the _secureCodeBox_ we provide a toolchain for continuous scanning of applications to find the low-hanging fruit issues early in the development process and free the resources of the penetration tester to concentrate on the major security issues.

The secureCodeBox project is running on [Kubernetes](https://kubernetes.io/). To install it you need [Helm](https://helm.sh), a package manager for Kubernetes. It is also possible to start the different integrated security vulnerability scanners based on a docker infrastructure.

### Quickstart with secureCodeBox on Kubernetes

You can find resources to help you get started on our [documentation website](https://www.securecodebox.io) including instruction on how to [install the secureCodeBox project](https://www.securecodebox.io/docs/getting-started/installation) and guides to help you [run your first scans](https://www.securecodebox.io/docs/getting-started/first-scans) with it.

## How to use this image
This `core` image is intended to work in combination with the OWASP secureCodeBox. For more information details please take a look at the documentation page: https://www.securecodebox.io/docs/getting-started/installation.

```bash
docker pull securecodebox/auto-discovery-cloud-aws
```

> [!NOTE]
> Even though the AWS Cloud AutoDiscovery monitors resources in AWS (currently only ECS), the AutoDiscovery itself is running in a Kubernetes cluster as part of the _secureCodeBox_.
> While the _secureCodeBox_ can be deployed to AWS, for example by using the Elastic Kubernetes Service, it also works from anywhere outside of AWS.

> [!WARNING]
> The AWS Cloud AutoDiscovery is in an __early prerelease state__.
> There is no initial state synchronization, no reordering for out-of-order events from eventbridge (which can rarely happen), and no retry when Kubernetes errors are encountered.
> This might lead to the local state and the AWS state diverging and resources not getting scanned.

## Prerequisites

The AWS AutoDiscovery detects changes in AWS by reading change events from an SQS queue.
To make sure these events are available there, EventBridge rules for the monitored resources need to be created.
The queue needs to be a FIFO queue, because the AWS AutoDiscovery assumes the events are delivered in order.

These instructions use the [AWS CLI](https://aws.amazon.com/cli/) to create the necessary resources and [jq](https://jqlang.github.io/jq/) to parse the responses.
See the [AWS docs](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-quickstart.html) for configuration and authentication options.

### Connect to AWS

All values are optional, as long as the connection to AWS works.
These values will be picked up by the AutoDiscovery, either through the Kubernetes secret defined below, by helm install or by the AutoDiscovery itself if it is running locally.
For setting up the necessary resources on AWS you can also use different connection options, SSO for example.

```bash
# Connection options for the CLI
export AWS_ACCESS_KEY_ID="<key id>"
export AWS_SECRET_ACCESS_KEY="<access key>"
export AWS_SESSION_TOKEN="<session token>"
export AWS_REGION="<region>"

# Create the Kubernetes secret for the service to read the credentials from (use -n to configure another namespace)
# The names of the secret and the keys can be configured through helm values
kubectl create secret generic aws-credentials --from-literal=aws-access-key-id=$AWS_ACCESS_KEY_ID --from-literal=aws-secret-access-key=$AWS_SECRET_ACCESS_KEY --from-literal=aws-session-token=$AWS_SESSION_TOKEN
```

### Create the rule and queue

This sets up a high throughput FIFO queue, because the AutoDiscovery service assumes the messages will be delivered in order.
EventBridge does not guarantee in order delivery though, so in rare cases the AutoDiscovery might delete scans too early or keep them around for too long.

```bash
# Configure the name both the queue and rule are going to use
name="secureCodeBox-autodiscovery-events"

# Create the queue
queue_url="$(aws sqs create-queue --queue-name "${name}.fifo" --attributes FifoQueue=true,ReceiveMessageWaitTimeSeconds=20,ContentBasedDeduplication=true,DeduplicationScope=messageGroup,FifoThroughputLimit=perMessageGroupId --tags "SCB-AutoDiscovery=" | jq -r ".QueueUrl")"
queue_arn="$(aws sqs get-queue-attributes --queue-url $queue_url --attribute-names QueueArn | jq -r ".Attributes.QueueArn")"

# Create the rule
rule_arn="$(aws events put-rule --name "${name}" --description "Gather events for the secureCodeBox AWS AutoDiscovery" --state ENABLED --tags "Key=SCB-AutoDiscovery,Value=" --event-pattern '{
  "source": ["aws.ecs"],
  "detail-type": ["ECS Task State Change", "ECS Container Instance State Change", "ECS Deployment State Change"]
}' | jq -r ".RuleArn")"

# Allow eventbridge to send messages to the queue
# Depending on the way you give access to the queue to the AutoDiscovery service, you might also need to give permissions to that
# The AutoDiscovery requires the sqs:ReceiveMessage and sqs:DeleteMessage permissions
timestamp="$(date +%s)"
policy='{
  "Id": "Policy'"${timestamp}"'",
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Stmt'"${timestamp}"'",
      "Action": "sqs:SendMessage",
      "Effect": "Allow",
      "Resource": "'"${queue_arn}"'",
      "Principal": {
        "Service": "events.amazonaws.com"
      },
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "'"${rule_arn}"'"
        }
      }
    }
  ]
}'
sqs_policy="$(echo $policy | jq -c -j | jq -R -s)"
aws sqs set-queue-attributes --queue-url $queue_url --attributes '{"Policy": '"${sqs_policy}"'}'

# Send the messages to the queue, if it shows "FailedEntryCount": 0 it worked
aws --no-cli-pager events put-targets --rule $name --targets '[{"Id": "Id'"$(uuidgen | tr '[:upper:]' '[:lower:]')"'", "Arn": "'"${queue_arn}"'", "SqsParameters": {"MessageGroupId": "secureCodeBox-AutoDiscovery"}}]'

# Set up variables for later use
export SQS_QUEUE_URL="${queue_url}"
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
[scb-docs]: https://www.securecodebox.io/
[scb-site]: https://www.securecodebox.io/
[scb-github]: https://github.com/secureCodeBox/
[scb-twitter]: https://twitter.com/secureCodeBox
[scb-slack]: https://join.slack.com/t/securecodebox/shared_invite/enQtNDU3MTUyOTM0NTMwLTBjOWRjNjVkNGEyMjQ0ZGMyNDdlYTQxYWQ4MzNiNGY3MDMxNThkZjJmMzY2NDRhMTk3ZWM3OWFkYmY1YzUxNTU
[scb-license]: https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
## Development

### Run the AutoDiscovery locally

To avoid having to build & deploy the AutoDiscovery every time you make a code change you can run it locally.
It automatically connects to your current cluster configured in your kube config.
To connect to AWS for development, you can either change the settings in `auto-discovery-cloud-aws-config.yaml` or set the `SQS_QUEUE_URL` environment variable and your preferred way of connecting to AWS.
You can for example set `AWS_REGION` and `AWS_PROFILE` for using SSO, set `AWS_SDK_LOAD_CONFIG=true` to load everything from `.aws/` or set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` directly.
You can check the [AWS SDK](https://docs.aws.amazon.com/sdk-for-go/v1/developer-guide/configuring-sdk.html) docs for more options and details.
```bash
make run
```

### Running the tests

```bash
# execute the tests locally
make test

# view the test coverage
go tool cover -html=cover.out
```
