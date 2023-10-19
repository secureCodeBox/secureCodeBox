// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package main_test

import (
	"context"
	"encoding/json"
	"reflect"
	"strings"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	awssdk "github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/ecs"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/pkg/aws"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

var _ = Describe("Integration tests", func() {

	const (
		eventuallyTimeout   = time.Second * 10
		consistentlyTimeout = time.Second * 5
		interval            = time.Millisecond * 250
	)

	// Templates to check the actual state against
	juiceShopScanName1 := "docker-io-bkimminich-test-scan-at-163482fed1f8e7c8558cc476a512b13768a8d2f7a04b8aab407ab02987c42382"
	juiceShopScanName1 = juiceShopScanName1[:62]
	juiceShopScanName2 := "docker-io-bkimminich-test-scan-two-at-163482fed1f8e7c8558cc476a512b13768a8d2f7a04b8aab407ab02987c42382"
	juiceShopScanName2 = juiceShopScanName2[:62]

	juiceShopScanGoTemplate := scanGoTemplate{
		map[string]string{"testAnnotation": "VeryUniqueId"},
		map[string]string{
			"testLabel":                    "VeryUniqueId",
			"app.kubernetes.io/managed-by": "securecodebox-autodiscovery",
		},
		[]string{"docker.io/bkimminich/juice-shop@sha256:163482fed1f8e7c8558cc476a512b13768a8d2f7a04b8aab407ab02987c42382"},
		nil,
		nil,
		nil,
	}

	helloWorldScanName1 := "docker-io-library-he-test-scan-at-7e9b6e7ba2842c91cf49f3e214d04a7a496f8214356f41d81a6e6dcad11f11e3"
	helloWorldScanName1 = helloWorldScanName1[:62]
	helloWorldScanName2 := "docker-io-library-he-test-scan-two-at-7e9b6e7ba2842c91cf49f3e214d04a7a496f8214356f41d81a6e6dcad11f11e3"
	helloWorldScanName2 = helloWorldScanName2[:62]

	helloWorldScanGoTemplate := scanGoTemplate{
		map[string]string{"testAnnotation": "ExtremelyUniqueId"},
		map[string]string{
			"testLabel":                    "ExtremelyUniqueId",
			"app.kubernetes.io/managed-by": "securecodebox-autodiscovery",
		},
		[]string{"docker.io/library/hello-world@sha256:7e9b6e7ba2842c91cf49f3e214d04a7a496f8214356f41d81a6e6dcad11f11e3"},
		nil,
		nil,
		nil,
	}

	// Prepare messages to send to the service
	stateChange := aws.EcsTaskStateChange{
		Source:     "aws.ecs",
		DetailType: "ECS Task State Change",
		Detail: ecs.Task{
			LastStatus: awssdk.String("PENDING"),
			Containers: []*ecs.Container{
				{
					ContainerArn: awssdk.String("VeryUniqueId"),
					LastStatus:   awssdk.String("PENDING"),
					Name:         awssdk.String("Juice Shop"),
					Image:        awssdk.String("bkimminich/juice-shop:v15.0.0"),
					ImageDigest:  awssdk.String(""),
				},
				{
					ContainerArn: awssdk.String("ExtremelyUniqueId"),
					LastStatus:   awssdk.String("PENDING"),
					Name:         awssdk.String("Hello"),
					Image:        awssdk.String("hello-world"),
					ImageDigest:  awssdk.String(""),
				},
			},
		},
	}
	content, err := json.Marshal(stateChange)
	Expect(err).NotTo(HaveOccurred())
	rawContent := string(content)

	pendingMsg1 := &sqs.ReceiveMessageOutput{
		Messages: []*sqs.Message{
			{
				Body: awssdk.String(strings.Clone(rawContent)),
			},
		},
	}

	stateChange.Detail.Containers[1].LastStatus = awssdk.String("RUNNING")
	stateChange.Detail.Containers[1].ImageDigest = awssdk.String("sha256:7e9b6e7ba2842c91cf49f3e214d04a7a496f8214356f41d81a6e6dcad11f11e3")
	content, err = json.Marshal(stateChange)
	Expect(err).NotTo(HaveOccurred())
	rawContent = string(content)

	runningMsg1 := &sqs.ReceiveMessageOutput{
		Messages: []*sqs.Message{
			{
				Body: awssdk.String(strings.Clone(rawContent)),
			},
		},
	}

	stateChange.Detail.LastStatus = awssdk.String("RUNNING")
	stateChange.Detail.Containers[0].LastStatus = awssdk.String("RUNNING")
	stateChange.Detail.Containers[0].ImageDigest = awssdk.String("sha256:163482fed1f8e7c8558cc476a512b13768a8d2f7a04b8aab407ab02987c42382")
	content, err = json.Marshal(stateChange)
	Expect(err).NotTo(HaveOccurred())
	rawContent = string(content)

	runningMsg2 := &sqs.ReceiveMessageOutput{
		Messages: []*sqs.Message{
			{
				Body: awssdk.String(strings.Clone(rawContent)),
			},
		},
	}

	otherTaskState := aws.EcsTaskStateChange{
		Source:     "aws.ecs",
		DetailType: "ECS Task State Change",
		Detail: ecs.Task{
			LastStatus: awssdk.String("RUNNING"),
			Containers: []*ecs.Container{
				{
					ContainerArn: awssdk.String("CompletelyOtherId"),
					LastStatus:   awssdk.String("RUNNING"),
					Name:         awssdk.String("Trustworthy Shop"),
					Image:        awssdk.String("bkimminich/juice-shop:latest"),
					ImageDigest:  awssdk.String("sha256:163482fed1f8e7c8558cc476a512b13768a8d2f7a04b8aab407ab02987c42382"),
				},
			},
		},
	}
	content, err = json.Marshal(otherTaskState)
	Expect(err).NotTo(HaveOccurred())
	rawContent = string(content)

	otherTaskMsg1 := &sqs.ReceiveMessageOutput{
		Messages: []*sqs.Message{
			{
				Body: awssdk.String(strings.Clone(rawContent)),
			},
		},
	}

	otherTaskState.Detail.LastStatus = awssdk.String("STOPPED")
	otherTaskState.Detail.Containers[0].LastStatus = awssdk.String("STOPPED")
	content, err = json.Marshal(otherTaskState)
	Expect(err).NotTo(HaveOccurred())
	rawContent = string(content)

	otherTaskMsg2 := &sqs.ReceiveMessageOutput{
		Messages: []*sqs.Message{
			{
				Body: awssdk.String(strings.Clone(rawContent)),
			},
		},
	}

	stateChange.Detail.LastStatus = awssdk.String("DEPROVISIONING")
	stateChange.Detail.Containers[1].LastStatus = awssdk.String("STOPPED")
	content, err = json.Marshal(stateChange)
	Expect(err).NotTo(HaveOccurred())
	rawContent = string(content)

	stopMsg1 := &sqs.ReceiveMessageOutput{
		Messages: []*sqs.Message{
			{
				Body: awssdk.String(strings.Clone(rawContent)),
			},
		},
	}

	stateChange.Detail.LastStatus = awssdk.String("STOPPED")
	stateChange.Detail.Containers[0].LastStatus = awssdk.String("STOPPED")
	content, err = json.Marshal(stateChange)
	Expect(err).NotTo(HaveOccurred())
	rawContent = string(content)

	stopMsg2 := &sqs.ReceiveMessageOutput{
		Messages: []*sqs.Message{
			{
				Body: awssdk.String(strings.Clone(rawContent)),
			},
		},
	}

	// Insert messages and simulate container run
	Context("when nothing is running", func() {
		It("should not create any scans", func() {
			sqsapi.MsgEntry <- pendingMsg1

			Consistently(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName1, namespace, juiceShopScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeFalse())
			Consistently(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName2, namespace, juiceShopScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeFalse())
			Consistently(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName1, namespace, helloWorldScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeFalse())
			Consistently(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName2, namespace, helloWorldScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeFalse())
		})
	})

	Context("when only hello-world is running", func() {
		It("should only create the hello-world scan", func() {
			sqsapi.MsgEntry <- runningMsg1

			Consistently(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName1, namespace, juiceShopScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeFalse())
			Consistently(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName2, namespace, juiceShopScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeFalse())
			Eventually(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName1, namespace, helloWorldScanGoTemplate)
			}, eventuallyTimeout, interval).Should(BeTrue())
			Eventually(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName2, namespace, helloWorldScanGoTemplate)
			}, eventuallyTimeout, interval).Should(BeTrue())
		})
	})

	Context("when Juice Shop is also running", func() {
		It("should also create the Juice Shop scan", func() {
			sqsapi.MsgEntry <- runningMsg2

			Eventually(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName1, namespace, juiceShopScanGoTemplate)
			}, eventuallyTimeout, interval).Should(BeTrue())
			Eventually(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName2, namespace, juiceShopScanGoTemplate)
			}, eventuallyTimeout, interval).Should(BeTrue())
			Consistently(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName1, namespace, helloWorldScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
			Consistently(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName2, namespace, helloWorldScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
		})

		It("should keep both scans", func() {
			sqsapi.MsgEntry <- runningMsg2

			Consistently(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName1, namespace, juiceShopScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
			Consistently(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName2, namespace, juiceShopScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
			Consistently(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName1, namespace, helloWorldScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
			Consistently(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName2, namespace, helloWorldScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
		})
	})

	Context("with other Task", func() {
		It("should keep the scans", func() {
			sqsapi.MsgEntry <- otherTaskMsg1

			Consistently(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName1, namespace, juiceShopScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
			Consistently(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName2, namespace, juiceShopScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
			Consistently(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName1, namespace, helloWorldScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
			Consistently(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName2, namespace, helloWorldScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
		})

		It("should keep both scans", func() {
			sqsapi.MsgEntry <- otherTaskMsg2

			Consistently(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName1, namespace, juiceShopScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
			Consistently(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName2, namespace, juiceShopScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
			Consistently(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName1, namespace, helloWorldScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
			Consistently(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName2, namespace, helloWorldScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
		})
	})

	Context("when only hello-world has stopped", func() {
		It("should only delete the hello-world scan", func() {
			sqsapi.MsgEntry <- stopMsg1

			Consistently(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName1, namespace, juiceShopScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
			Consistently(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName2, namespace, juiceShopScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeTrue())
			Eventually(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName1, namespace, helloWorldScanGoTemplate)
			}, eventuallyTimeout, interval).Should(BeFalse())
			Eventually(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName2, namespace, helloWorldScanGoTemplate)
			}, eventuallyTimeout, interval).Should(BeFalse())
		})
	})

	Context("when all containers have stopped", func() {
		It("should also delete the Juice Shop scan", func() {
			sqsapi.MsgEntry <- stopMsg2

			Eventually(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName1, namespace, juiceShopScanGoTemplate)
			}, eventuallyTimeout, interval).Should(BeFalse())
			Eventually(func() bool {
				return checkIfScanExists(ctx, juiceShopScanName2, namespace, juiceShopScanGoTemplate)
			}, eventuallyTimeout, interval).Should(BeFalse())
			Consistently(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName1, namespace, helloWorldScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeFalse())
			Consistently(func() bool {
				return checkIfScanExists(ctx, helloWorldScanName2, namespace, helloWorldScanGoTemplate)
			}, consistentlyTimeout, interval).Should(BeFalse())
		})
	})
})

func checkIfScanExists(ctx context.Context, name string, namespace string, scanSpec scanGoTemplate) bool {
	var scheduledScan executionv1.ScheduledScan
	err := k8sClient.Get(ctx, types.NamespacedName{Name: name, Namespace: namespace}, &scheduledScan)
	if errors.IsNotFound(err) {
		return false
	}
	return checkScanGoTemplate(scheduledScan, scanSpec)
}

func checkScanGoTemplate(scan executionv1.ScheduledScan, scanSpec scanGoTemplate) bool {
	annotations := scan.ObjectMeta.Annotations
	labels := scan.ObjectMeta.Labels
	parameters := scan.Spec.ScanSpec.Parameters
	volumes := scan.Spec.ScanSpec.Volumes
	envVars := scan.Spec.ScanSpec.Env

	annotationsCorrect := reflect.DeepEqual(annotations, scanSpec.Annotations)
	labelsCorrect := reflect.DeepEqual(labels, scanSpec.Labels)
	parametersCorrect := reflect.DeepEqual(parameters, scanSpec.Parameters)
	volumesCorrect := reflect.DeepEqual(volumes, scanSpec.Volumes)
	envVarsCorrect := reflect.DeepEqual(envVars, scanSpec.EnvVars)

	Expect(annotationsCorrect).Should(BeTrue())
	Expect(labelsCorrect).Should(BeTrue())
	Expect(parametersCorrect).Should(BeTrue())
	Expect(volumesCorrect).Should(BeTrue())
	Expect(envVarsCorrect).Should(BeTrue())
	Expect(scan.Spec.ScanSpec.HookSelector.MatchExpressions).To(ContainElement(
		metav1.LabelSelectorRequirement{
			Operator: metav1.LabelSelectorOpIn,
			Key:      "foo",
			Values:   []string{"bar", "baz"},
		},
	))
	Expect(scan.Spec.ScanSpec.HookSelector.MatchExpressions).To(ContainElement(
		metav1.LabelSelectorRequirement{

			Operator: metav1.LabelSelectorOpDoesNotExist,
			Key:      "foo",
		},
	))
	return annotationsCorrect && labelsCorrect && parametersCorrect
}

type scanGoTemplate struct {
	Annotations    map[string]string
	Labels         map[string]string
	Parameters     []string
	InitContainers []corev1.Container
	Volumes        []corev1.Volume
	EnvVars        []corev1.EnvVar
}
