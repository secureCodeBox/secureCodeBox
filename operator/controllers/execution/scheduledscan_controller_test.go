// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

//go:build fast
// +build fast

package controllers

import (
	"context"
	"time"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	//+kubebuilder:scaffold:imports
)

type testData struct {
	in                   map[string]string
	expectedMapKeyLength int
}

var _ = Describe("ScheduledScan controller", func() {
	Context("Should get annotations for Scan", func() {
		tests := []testData{
			{
				in: map[string]string{
					"foobar": "bar",
				},
				expectedMapKeyLength: 0,
			},
			{
				in: map[string]string{
					"foobar.securecodebox.io/bar": "bar",
				},
				expectedMapKeyLength: 1,
			},
			{
				in: map[string]string{
					"barfoo.securecodebox.io/bar": "bar",
					"foo":                         "bar",
				},
				expectedMapKeyLength: 1,
			},
			{
				in: map[string]string{
					"barfoo.securecodebox.io/bar": "bar",
					"barfoo.securecodebox.io/foo": "bar",
				},
				expectedMapKeyLength: 2,
			},
		}
		It("Should drop all annotations not prefixed with \"*.securecodebox.io/*\"", func() {
			for _, test := range tests {
				scheduledScan := executionv1.ScheduledScan{
					ObjectMeta: metav1.ObjectMeta{
						Name:        "foobar",
						Annotations: test.in,
					},
				}
				actual := getAnnotationsForScan(scheduledScan)
				Expect(len(actual)).Should(Equal(test.expectedMapKeyLength))
			}
		})
	})
	Context("A Scan is triggred due to a Scheduled Scan with Interval in Spec", func() {
		It("The ScheduledScan's Finding Summary shoud be updated of with the results of the successful Scan", func() {
			ctx := context.Background()
			namespace := "scantype-multiple-scheduled-scan-triggerd-test"

			createNamespace(ctx, namespace)
			createScanType(ctx, namespace)
			scheduledScan := createScheduledScanWithInterval(ctx, namespace, true, 42*time.Hour, executionv1.ForbidConcurrent)

			var scanlist executionv1.ScanList
			// ensure that the ScheduledScan has been triggered
			waitForScheduledScanToBeTriggered(ctx, namespace, timeout)
			k8sClient.List(ctx, &scanlist, client.InNamespace(namespace))

			Expect(scanlist.Items).Should(HaveLen(1))

			scan := scanlist.Items[0]
			scan.Status.State = executionv1.ScanStateDone

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
				return scheduledScan.Status.Findings.Count != 0
			}, timeout, interval).Should(BeTrue())

			Expect(scheduledScan.Status.Findings.Count).Should(Equal(uint64(42)))
			Expect(scheduledScan.Status.Findings.FindingSeverities).Should(Equal(executionv1.FindingSeverities{High: 42}))
			Expect(scheduledScan.Status.Findings.FindingCategories).Should(Equal(map[string]uint64{"Open Port": 42}))
		})
	})

	Context("A Scan is triggred due to a Scheduled Scan with a ConcurrencyPolicy", func() {
		It("A second scheduled scan should not start before the first one is finished if the concurency policy is set to ForbidConcurrent", func() {

			ctx := context.Background()
			namespace := "scheduled-scan-triggerd-concurrency-forbid-test"
			createNamespace(ctx, namespace)
			createScanType(ctx, namespace)
			createScheduledScanWithInterval(ctx, namespace, true, 1*time.Second, executionv1.ForbidConcurrent)

			var scanlist executionv1.ScanList
			// ensure that the ScheduledScan has been triggered
			waitForScheduledScanToBeTriggered(ctx, namespace, timeout)
			k8sClient.List(ctx, &scanlist, client.InNamespace(namespace))

			Expect(scanlist.Items).Should(HaveLen(1))
			time.Sleep(2 * time.Second)
			// make sure that no second scan has been triggered
			k8sClient.List(ctx, &scanlist, client.InNamespace(namespace))
			Expect(scanlist.Items).Should(HaveLen(1))

		})

		It("A second scheduled scan should start before the first one is finished if the concurency policy is set to AllowConcurrent", func() {

			ctx := context.Background()
			namespace := "scheduled-scan-triggerd-concurrency-allow-test"
			createNamespace(ctx, namespace)
			createScanType(ctx, namespace)
			createScheduledScanWithInterval(ctx, namespace, true, 1*time.Second, executionv1.AllowConcurrent)

			var scanlist executionv1.ScanList
			// ensure that the ScheduledScan has been triggered
			waitForScheduledScanToBeTriggered(ctx, namespace, timeout)
			k8sClient.List(ctx, &scanlist, client.InNamespace(namespace))
			Expect(scanlist.Items).ShouldNot(BeEmpty())

			time.Sleep(2 * time.Second)

			// make sure more than one scan has been triggered
			k8sClient.List(ctx, &scanlist, client.InNamespace(namespace))
			Expect(scanlist.Items).ShouldNot(HaveLen(1))
		})

		It("A second scheduled scan should replace the first one, before the first one is finished if the concurency policy is set to ReplaceConcurrent", func() {

			ctx := context.Background()
			namespace := "scheduled-scan-triggerd-concurrency-replace-test"
			createNamespace(ctx, namespace)
			createScanType(ctx, namespace)
			createScheduledScanWithInterval(ctx, namespace, true, 1*time.Second, executionv1.ReplaceConcurrent)

			var scanlist executionv1.ScanList
			// ensure that the ScheduledScan has been triggered
			waitForScheduledScanToBeTriggered(ctx, namespace, timeout)
			k8sClient.List(ctx, &scanlist, client.InNamespace(namespace))
			Expect(scanlist.Items).Should(HaveLen(1))
			firstScanName := scanlist.Items[0].Name

			time.Sleep(2 * time.Second)

			// make sure the first scan has been replaced
			k8sClient.List(ctx, &scanlist, client.InNamespace(namespace))
			secondScanName := scanlist.Items[0].Name
			Expect(scanlist.Items).Should(HaveLen(1))
			Expect(firstScanName).ShouldNot(Equal(secondScanName))
		})
	})
})
