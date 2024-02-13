---
title: "secreCodeBox AutoDiscovery for AWS"
category: "core"
type: "AutoDiscovery"
state: "developing"
appVersion: ""
usecase: "secureCodeBox AutoDiscovery for AWS discovers and starts scans for containers running in AWS ECS."
---

![auto-discovery logo](https://www.securecodebox.io/img/Logo_Color.svg)

The secureCodeBox _AutoDiscovery_ is running on kubernetes (K8S) and is an optional component of the complete secureCodeBox stack.
The AWS AutoDiscovery needs to be deployed along side the secureCodeBox Operator. It monitors security relevant resources inside the AWS Elastic Container Service and automatically creates scans to continuously monitor security aspects of the resources.

<!-- end -->

The AutoDiscovery controller will automatically detect these new resources (containers) and start secureCodeBox _scans_ for them:

1. An image scan scanning for vulnerable libraries in the docker / container image of the deployment. (Using trivy)
2. An image scan to create a Software Bill of Materials (SBOM) for the container. (Using trivy)

The AutoDiscovery automatically tracks the lifecycle of the ECS containers and will automatically start new scans for new application versions.
The scan type can be defined with `config.kubernetes.scanConfigs[0].scanType`.

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
  <a href="https://infosec.exchange/@secureCodeBox"><img alt="Mastodon Follower" src="https://img.shields.io/mastodon/follow/111902499714281911?domain=https%3A%2F%2Finfosec.exchange%2F"/></a>
</p>

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

## Deployment
The auto-discovery-cloud-aws chart can be deployed via helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install auto-discovery-cloud-aws secureCodeBox/auto-discovery-cloud-aws
```

To directly deploy the auto-discovery-cloud-aws chart with the options for AWS configured, you can pass additional config values to helm:

```bash
# Install HelmChart (use -n to configure another namespace)
helm upgrade --install auto-discovery-cloud-aws secureCodeBox/auto-discovery-cloud-aws --set="config.aws.queueUrl=${SQS_QUEUE_URL}" --set="config.aws.region=${AWS_REGION}"
```

## Requirements

Kubernetes: `>=v1.11.0-0`

## Additional configuration

### Installing the ScanType

The AutoDiscovery creates _ScheduledScans_ for each resource it tracks.
For these to work you need to install the correct scan types into the same namespace the AutoDiscovery is running in.
The AutoDiscovery will create the scans in its own namespace.

### Optional: In- / Excluding Resources from the AutoDiscovery

The AutoDiscovery will create scans for everything it sees in the queue.
You can limit the messages to specific ECS clusters by adding a filter to the EventBridge rule.
The following command will either create or update the rule:

```bash
aws events put-rule --name "${name}" --description "Gather events for the secureCodeBox AWS AutoDiscovery" --state ENABLED --event-pattern '{
  "source": ["aws.ecs"],
  "detail-type": ["ECS Task State Change", "ECS Container Instance State Change", "ECS Deployment State Change"],
  "detail": {
    "clusterArn": ["<arn of the cluster you want to include>"]
  }
}'
```

## AWS Costs

As of October 2023, the AWS AutoDiscovery incurs no or very little cost on AWS.
EventBridge rules for internal events generated by AWS, which is all the AutoDiscovery uses, are [free of charge](https://aws.amazon.com/eventbridge/pricing/).
The AutoDiscovery generates approximately 130,000 requests to SQS each month to poll the queue every 20 seconds using [long polling](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-short-and-long-polling.html).
In addition to that there are two requests for each message, one to add it to the queue and one to delete it.
The first million requests to SQS is free, after that [each million costs around $0.50](https://aws.amazon.com/sqs/pricing/) depending on the region.
Data transfers are priced at $0.09 per 10TB.

This means the AWS AutoDiscovery should either be free or cheaper than $1/month even for larger or busier setups.

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| awsAuthentication | object | `{"accessKeyIdKey":"aws-access-key-id","secretAccessKeyKey":"aws-secret-access-key","sessionTokenKey":"aws-session-token","userSecret":"aws-credentials"}` | Authentication information for AWS, use this to configure the secret which contains the access key. Creating this secret is optional, when running on AWS itself the auto discovery will automatically use the IAM role to authenticate. |
| awsAuthentication.accessKeyIdKey | string | `"aws-access-key-id"` | Name of the key that contains the AWS_ACCESS_KEY_ID |
| awsAuthentication.secretAccessKeyKey | string | `"aws-secret-access-key"` | Name of the key that contains the AWS_SECRET_ACCESS_KEY |
| awsAuthentication.sessionTokenKey | string | `"aws-session-token"` | Name of the key that contains the AWS_SESSION_TOKEN |
| awsAuthentication.userSecret | string | `"aws-credentials"` | name of the kubernetes secret that contains the access key |
| config.aws | object | `{"queueUrl":"","region":""}` | settings to connect to AWS and receive the updates |
| config.aws.queueUrl | string | `""` | url of the SQS queue which receives the state changes. Can be overridden by setting the SQS_QUEUE_URL environment variable. |
| config.aws.region | string | `""` | aws region to connect to. Can be overridden by setting the AWS_REGION environment variable. |
| config.kubernetes | object | `{"scanConfigs":[{"annotations":{},"hookSelector":{},"labels":{},"name":"trivy","parameters":["{{ .ImageID }}"],"repeatInterval":"168h","scanType":"trivy-image"},{"annotations":{"dependencytrack.securecodebox.io/project-name":"{{ .Image.ShortName }}","dependencytrack.securecodebox.io/project-version":"{{ .Image.Version }}"},"hookSelector":{},"labels":{},"name":"trivy-sbom","parameters":["{{ .ImageID }}"],"repeatInterval":"168h","scanType":"trivy-sbom-image"}]}` | settings to configure how scans get created in kubernetes |
| config.kubernetes.scanConfigs[0].annotations | object | `{}` | annotations to be added to the scans started by the auto-discovery, all annotation values support templating |
| config.kubernetes.scanConfigs[0].hookSelector | object | `{}` | hookSelector allows to specify a LabelSelector with which the hooks are selected, see: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors Both matchLabels and matchExpressions are supported. All values in the matchLabels map support templating. MatchExpressions support templating in the `key` field and in every entry in the `values` list. If a value in the list renders to an empty string it is removed from the list. |
| config.kubernetes.scanConfigs[0].labels | object | `{}` | labels to be added to the scans started by the auto-discovery, all label values support templating |
| config.kubernetes.scanConfigs[0].name | string | `"trivy"` | unique name to distinguish scans |
| config.kubernetes.scanConfigs[0].parameters | list | `["{{ .ImageID }}"]` | parameters used for the scans created by the containerAutoDiscovery, all parameters support templating |
| config.kubernetes.scanConfigs[0].repeatInterval | string | `"168h"` | interval in which scans are automatically repeated. If the target is updated (meaning a new image revision is deployed) the scan will repeated beforehand and the interval is reset. |
| config.kubernetes.scanConfigs[1].annotations | object | `{"dependencytrack.securecodebox.io/project-name":"{{ .Image.ShortName }}","dependencytrack.securecodebox.io/project-version":"{{ .Image.Version }}"}` | annotations to be added to the scans started by the auto-discovery, all annotation values support templating |
| config.kubernetes.scanConfigs[1].hookSelector | object | `{}` | hookSelector allows to specify a LabelSelector with which the hooks are selected, see: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors Both matchLabels and matchExpressions are supported. All values in the matchLabels map support templating. MatchExpressions support templating in the `key` field and in every entry in the `values` list. If a value in the list renders to an empty string it is removed from the list. |
| config.kubernetes.scanConfigs[1].labels | object | `{}` | labels to be added to the scans started by the auto-discovery, all label values support templating |
| config.kubernetes.scanConfigs[1].name | string | `"trivy-sbom"` | unique name to distinguish scans |
| config.kubernetes.scanConfigs[1].parameters | list | `["{{ .ImageID }}"]` | parameters used for the scans created by the containerAutoDiscovery, all parameters support templating |
| config.kubernetes.scanConfigs[1].repeatInterval | string | `"168h"` | interval in which scans are automatically repeated. If the target is updated (meaning a new image revision is deployed) the scan will repeated beforehand and the interval is reset. |
| image.pullPolicy | string | `"IfNotPresent"` | Image pull policy. One of Always, Never, IfNotPresent. Defaults to Always if :latest tag is specified, or IfNotPresent otherwise. More info: https://kubernetes.io/docs/concepts/containers/images#updating-images |
| image.repository | string | `"securecodebox/auto-discovery-cloud-aws"` |  |
| image.tag | string | `nil` |  |
| imagePullSecrets | list | `[]` | Define imagePullSecrets when a private registry is used (see: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/) |
| podSecurityContext | object | `{}` | Sets the securityContext on the operators pod level. See: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-container |
| resources | object | `{"limits":{"cpu":"100m","memory":"100Mi"},"requests":{"cpu":"100m","memory":"20Mi"}}` | CPU/memory resource requests/limits (see: https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/, https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/) |
| securityContext | object | `{"allowPrivilegeEscalation":false,"capabilities":{"drop":["all"]},"privileged":false,"readOnlyRootFilesystem":true,"runAsNonRoot":true}` | Sets the securityContext on the operators container level. See: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-pod |
| securityContext.allowPrivilegeEscalation | bool | `false` | Ensure that users privileges cannot be escalated |
| securityContext.capabilities.drop[0] | string | `"all"` | This drops all linux privileges from the operator container. They are not required |
| securityContext.privileged | bool | `false` | Ensures that the operator container is not run in privileged mode |
| securityContext.readOnlyRootFilesystem | bool | `true` | Prevents write access to the containers file system |
| securityContext.runAsNonRoot | bool | `true` | Enforces that the Operator image is run as a non root user |

## License
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Code of secureCodeBox is licensed under the [Apache License 2.0][scb-license].

[scb-owasp]:    https://www.owasp.org/index.php/OWASP_secureCodeBox
[scb-docs]:     https://www.securecodebox.io/
[scb-site]:     https://www.securecodebox.io/
[scb-github]:   https://github.com/secureCodeBox/
[scb-mastodon]: https://infosec.exchange/@secureCodeBox
[scb-slack]:    https://owasp.org/slack/invite
[scb-license]:  https://github.com/secureCodeBox/secureCodeBox/blob/master/LICENSE
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
