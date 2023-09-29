// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package kubernetes_test

import (
	"context"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/kubernetes"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"k8s.io/apimachinery/pkg/types"
)

var _ = Describe("Kubernetes service", func() {

	const (
		timeout  = time.Second * 10
		interval = time.Millisecond * 250
	)

	scanName := "docker-io-bkimminich-aws-trivy-sbom-at-28915718daff4d66ceb50accbaac0e87bf09f857096ba82ea2404187b7077f42"
	scanName = scanName[:62]

	req := kubernetes.Request{
		State: "RUNNING",
		Container: kubernetes.ContainerInfo{
			Id: "VeryUniqueId",
			Image: kubernetes.ImageInfo{
				Name:   "docker.io/bkimminich/juice-shop",
				Digest: "sha256:28915718daff4d66ceb50accbaac0e87bf09f857096ba82ea2404187b7077f42",
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

	Describe("Create ScheduledScan", func() {
		Context("for juice-shop container", func() {
			It("should create the correct ScheduledScan", func() {
				awsReconciler.Reconcile(ctx, req)

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
