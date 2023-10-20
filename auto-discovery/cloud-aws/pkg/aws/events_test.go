// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package aws

import (
	"encoding/json"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	awssdk "github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/ecs"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/pkg/kubernetes"
)

var _ = Describe("AWS Events unit tests", func() {
	stateChange := EcsTaskStateChange{
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

	reqs := []kubernetes.Request{
		{
			State: "RUNNING",
			Container: kubernetes.ContainerInfo{
				Id: "VeryUniqueId",
				Image: kubernetes.ImageInfo{
					Name:   "bkimminich/juice-shop:v15.0.0",
					Digest: "sha256:163482fed1f8e7c8558cc476a512b13768a8d2f7a04b8aab407ab02987c42382",
				},
			},
		},
	}

	Describe("Generating reconcile requests", func() {
		Context("for running juice-shop container", func() {
			It("should generate the correct request", func() {
				Expect(handleEcsEvent(rawContent, log)).To(Equal(reqs))
			})
		})
	})
})
