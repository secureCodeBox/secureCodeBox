// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package main_test

import (
	"context"
	"encoding/json"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	awssdk "github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/ecs"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/aws"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"k8s.io/apimachinery/pkg/types"
)

var _ = Describe("Integration tests", func() {

	const (
		timeout  = time.Second * 10
		interval = time.Millisecond * 250
	)

	scanName := "docker-io-bkimminich-aws-trivy-sbom-at-163482fed1f8e7c8558cc476a512b13768a8d2f7a04b8aab407ab02987c42382"
	scanName = scanName[:62]

	stateChange := aws.EcsTaskStateChange{
		Source:     "aws.ecs",
		DetailType: "ECS Task State Change",
		Detail: ecs.Task{
			LastStatus: awssdk.String("RUNNING"),
			Containers: []*ecs.Container{
				{
					ContainerArn: awssdk.String("VeryUniqueId"),
					LastStatus:   awssdk.String("RUNNING"),
					Name:         awssdk.String("Juice Shop"),
					Image:        awssdk.String("bkimminich/juice-shop:v15.0.0"),
					ImageDigest:  awssdk.String("sha256:163482fed1f8e7c8558cc476a512b13768a8d2f7a04b8aab407ab02987c42382"),
				},
			},
		},
	}
	content, err := json.Marshal(stateChange)
	Expect(err).NotTo(HaveOccurred())
	rawContent := string(content)

	msg := &sqs.ReceiveMessageOutput{
		Messages: []*sqs.Message{
			{
				Body: &rawContent,
			},
		},
	}

	Describe("Create ScheduledScan", func() {
		Context("for juice-shop container", func() {
			It("should create the correct ScheduledScan", func() {
				sqsapi.MsgEntry <- msg

				Eventually(func() error {
					return checkIfScanExists(ctx, scanName, namespace)
				}, timeout, interval).Should(Succeed())
			})
		})
	})
})

func checkIfScanExists(ctx context.Context, name string, namespace string) error {
	var scheduledScan executionv1.ScheduledScan
	return k8sClient.Get(ctx, types.NamespacedName{Name: name, Namespace: namespace}, &scheduledScan)
}
