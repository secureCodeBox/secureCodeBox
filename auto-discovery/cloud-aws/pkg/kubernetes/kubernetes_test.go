// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package kubernetes

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Kubernetes unit tests", func() {
	scanName := "docker-io-bkimminich-aws-trivy-sbom-at-163482fed1f8e7c8558cc476a512b13768a8d2f7a04b8aab407ab02987c42382"
	scanName = scanName[:62]

	req := Request{
		State: "RUNNING",
		Container: ContainerInfo{
			Id: "VeryUniqueId",
			Image: ImageInfo{
				Name:   "docker.io/bkimminich/juice-shop",
				Digest: "sha256:163482fed1f8e7c8558cc476a512b13768a8d2f7a04b8aab407ab02987c42382",
			},
		},
	}

	Describe("Generating ScheduledScan name", func() {
		Context("for juice-shop container", func() {
			It("should generate the correct name", func() {
				Expect(getScanName(req, "aws-trivy-sbom")).To(Equal(scanName))
			})
		})
	})
})
