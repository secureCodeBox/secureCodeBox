// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package kubernetes_test

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/kubernetes"
)

var _ = Describe("Kubernetes unit tests", func() {
	scanName := "docker-io-bkimminich-aws-trivy-sbom-at-163482fed1f8e7c8558cc476a512b13768a8d2f7a04b8aab407ab02987c42382"
	scanName = scanName[:62]

	req := kubernetes.Request{
		State: "RUNNING",
		Container: kubernetes.ContainerInfo{
			Id: "VeryUniqueId",
			Image: kubernetes.ImageInfo{
				Name:   "docker.io/bkimminich/juice-shop",
				Digest: "sha256:163482fed1f8e7c8558cc476a512b13768a8d2f7a04b8aab407ab02987c42382",
			},
		},
	}

	Describe("Generating ScheduledScan name", func() {
		Context("for juice-shop container", func() {
			It("should generate the correct name", func() {
				Expect(kubernetes.GetScanName(req, "aws-trivy-sbom")).To(Equal(scanName))
			})
		})
	})
})
