// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

//go:build slow
// +build slow

package controllers

import (
	"context"
	"time"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	//+kubebuilder:scaffold:imports
)

var _ = Describe("ScheduledScan controller", func() {
	Context("A Scan is triggred due to a Scheduled Scan with Schedule in Spec", func() {
		It("The ScheduledScan's should be triggered according to the Schedule", func() {
			ctx := context.Background()
			namespace := "scantype-multiple-scheduled-scan-triggerd-test-schedule"

			createNamespace(ctx, namespace)
			createScanType(ctx, namespace)
			scheduledScan := createScheduledScanWithSchedule(ctx, namespace, true)

			var scanlist executionv1.ScanList

			// ensure that the ScheduledScan has been triggered
			waitForScheduledScanToBeTriggered(ctx, namespace, 90*time.Second)
			k8sClient.List(ctx, &scanlist, client.InNamespace(namespace))

			Expect(scheduledScan.Spec.Schedule).Should(Equal("*/1 * * * *"))
			Expect(scanlist.Items).Should(HaveLen(1))
		})
	})
})
