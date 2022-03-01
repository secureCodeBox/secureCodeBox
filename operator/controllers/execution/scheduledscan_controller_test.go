// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"context"
	"reflect"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	//+kubebuilder:scaffold:imports
)

var _ = Describe("Scheduledscan controller", func() {
	Context("If multiple scheduled scans triggers", func() {
		It("Update Finding Summary of scan with the results of the latest successful Scan", func() {
			ctx := context.Background()
			namespace := "scantype-multiple-scheduled-scan-triggerd-test"

			createNamespace(ctx, namespace)
			createScanType(ctx, namespace)
			scheduledScan := createScheduledScan(ctx, namespace, true)

			var scanlist executionv1.ScanList
			// ensure that the ScheduledScan has been triggered
			waitForScheduledScanToBeTriggered(ctx, namespace)
			k8sClient.List(ctx, &scanlist, client.InNamespace(namespace))

			Expect(scanlist.Items).Should(HaveLen(1))

			scan := scanlist.Items[0]
			scan.Status.State = "Done"

			scan.Status.Findings = executionv1.FindingStats{
				Count:             42,
				FindingSeverities: executionv1.FindingSeverities{High: 42},
				FindingCategories: map[string]uint64{"Open Port": 42},
			}

			k8sClient.Status().Update(ctx, &scan)

			Eventually(func() bool {
				err := k8sClient.Get(ctx, types.NamespacedName{Name: "test-scan", Namespace: namespace}, &scheduledScan)
				if errors.IsNotFound(err) {
					panic("ScheduledScan should be present for this check!")
				}
				return (scheduledScan.Status.Findings.Count == 42 &&
					scheduledScan.Status.Findings.FindingSeverities == executionv1.FindingSeverities{High: 42} &&
					reflect.DeepEqual(scheduledScan.Status.Findings.FindingCategories, map[string]uint64{"Open Port": 42}))
			}, timeout, interval).Should(BeTrue())

		})
	})
})
