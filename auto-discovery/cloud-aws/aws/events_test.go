// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package aws

import (
	"encoding/json"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/kubernetes"
)

var _ = Describe("AWS Events unit tests", func() {
	stateChange := EcsTaskStateChange{
		Source:     "aws.ecs",
		DetailType: "ECS Task State Change",
		Detail: EcsStateDetail{
			LastStatus: "RUNNING",
			Containers: []EcsContainerInfo{
				{
					ContainerArn: "VeryUniqueId",
					LastStatus:   "RUNNING",
					Name:         "Juice Shop",
					Image:        "bkimminich/juice-shop:v15.0.0",
					ImageDigest:  "sha256:163482fed1f8e7c8558cc476a512b13768a8d2f7a04b8aab407ab02987c42382",
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
					Name:   "docker.io/bkimminich/juice-shop",
					Digest: "sha256:163482fed1f8e7c8558cc476a512b13768a8d2f7a04b8aab407ab02987c42382",
				},
			},
		},
	}

	Describe("Generating reconcile requests", func() {
		Context("for running juice-shop container", func() {
			It("should generate the correct request", func() {
				Expect(handleEcsEvent(rawContent)).To(Equal(reqs))
			})
		})
	})
})
