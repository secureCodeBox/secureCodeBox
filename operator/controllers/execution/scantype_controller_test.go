// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"context"
	"time"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"k8s.io/apimachinery/pkg/api/errors"

	"k8s.io/apimachinery/pkg/types"
	//+kubebuilder:scaffold:imports
)

// These tests use Ginkgo (BDD-style Go testing framework). Refer to
// http://onsi.github.io/ginkgo/ to learn more about Ginkgo.
// Define utility constants for object names and testing timeouts and intervals.
const (
	timeout  = time.Second * 10
	interval = time.Millisecond * 250
)

var _ = Describe("ScanType controller", func() {
	Context("Restarting ScheduledScans on ScanType Config Changes", func() {
		It("Should restart a scheduledScan when the scantype was update", func() {
			ctx := context.Background()
			namespace := "scantype-autorestart-config-change-test"

			createNamespace(ctx, namespace)
			createScanType(ctx, namespace)
			scheduledScan := createScheduledScanWithInterval(ctx, namespace, true)

			// ensure that the ScheduledScan has been triggered
			waitForScheduledScanToBeTriggered(ctx, namespace)
			k8sClient.Get(ctx, types.NamespacedName{Name: "test-scan", Namespace: namespace}, &scheduledScan)
			initialExecutionTime := *scheduledScan.Status.LastScheduleTime

			// wait at least one second to ensure that the unix timestamps are at least one second apart.
			time.Sleep(1 * time.Second)

			By("Update ScanType to trigger rescan")
			var scanType executionv1.ScanType
			k8sClient.Get(ctx, types.NamespacedName{Name: "nmap", Namespace: namespace}, &scanType)
			if scanType.ObjectMeta.Annotations == nil {
				scanType.ObjectMeta.Annotations = map[string]string{}
			}
			scanType.ObjectMeta.Annotations["foobar.securecodebox.io/example"] = "barfoo"
			err := k8sClient.Update(ctx, &scanType)
			if err != nil {
				panic(err)
			}

			By("Controller should set the lastScheduled Timestamp to the past to force a re-scan")
			Eventually(func() bool {
				err := k8sClient.Get(ctx, types.NamespacedName{Name: "test-scan", Namespace: namespace}, &scheduledScan)
				if errors.IsNotFound(err) {
					panic("ScheduledScan should be present for this check!")
				}

				return scheduledScan.Status.LastScheduleTime.Unix() != initialExecutionTime.Unix()
			}, timeout, interval).Should(BeTrue())
		})
	})

	Context("Should not trigger rescan when ScanType stays the same", func() {
		It("Should restart a scheduledScan when the scantype was update", func() {
			ctx := context.Background()
			namespace := "scantype-no-autorestart-config-change-test"

			createNamespace(ctx, namespace)
			createScanType(ctx, namespace)
			scheduledScan := createScheduledScanWithInterval(ctx, namespace, true)

			// ensure that the ScheduledScan has been triggered
			waitForScheduledScanToBeTriggered(ctx, namespace)
			k8sClient.Get(ctx, types.NamespacedName{Name: "test-scan", Namespace: namespace}, &scheduledScan)
			initialExecutionTime := *scheduledScan.Status.LastScheduleTime

			// wait at least one second to ensure that the unix timestamps would be at least one second apart.
			time.Sleep(1 * time.Second)

			By("Controller should not restart scheduledscan")
			Consistently(func() bool {
				var scheduledScan executionv1.ScheduledScan
				err := k8sClient.Get(ctx, types.NamespacedName{Name: "test-scan", Namespace: namespace}, &scheduledScan)
				if errors.IsNotFound(err) {
					panic("ScheduledScan should be present for this check!")
				}

				return scheduledScan.Status.LastScheduleTime.Unix() == initialExecutionTime.Unix()
			}, timeout, interval).Should(BeTrue(), "Scan was restarted without need")
		})
	})

	Context("Should not trigger rescan when RetriggerOnScanTypeChange is set to False", func() {
		It("Should restart a scheduledScan when RetriggerOnScanTypeChange is set to True", func() {
			ctx := context.Background()
			namespace := "scantype-retrigger-on-scantype-false-test"

			createNamespace(ctx, namespace)
			createScanType(ctx, namespace)
			scheduledScan := createScheduledScanWithInterval(ctx, namespace, false)

			// ensure that the ScheduledScan has been triggered
			waitForScheduledScanToBeTriggered(ctx, namespace)
			k8sClient.Get(ctx, types.NamespacedName{Name: "test-scan", Namespace: namespace}, &scheduledScan)
			initialExecutionTime := *scheduledScan.Status.LastScheduleTime

			// wait at least one second to ensure that the unix timestamps are at least one second apart.
			time.Sleep(1 * time.Second)

			By("Update ScanType to trigger rescan")
			var scanType executionv1.ScanType
			k8sClient.Get(ctx, types.NamespacedName{Name: "nmap", Namespace: namespace}, &scanType)
			if scanType.ObjectMeta.Annotations == nil {
				scanType.ObjectMeta.Annotations = map[string]string{}
			}
			scanType.ObjectMeta.Annotations["foobar.securecodebox.io/example"] = "barfoo"
			err := k8sClient.Update(ctx, &scanType)
			if err != nil {
				panic(err)
			}

			By("Controller should set the lastScheduled Timestamp to the past to force a re-scan")
			Eventually(func() bool {
				err := k8sClient.Get(ctx, types.NamespacedName{Name: "test-scan", Namespace: namespace}, &scheduledScan)
				if errors.IsNotFound(err) {
					panic("ScheduledScan should be present for this check!")
				}

				return scheduledScan.Status.LastScheduleTime.Unix() == initialExecutionTime.Unix()
			}, timeout, interval).Should(BeTrue())
		})
	})
})

func waitForScheduledScanToBeTriggered(ctx context.Context, namespace string) {
	var scheduledScan executionv1.ScheduledScan
	By("Wait for ScheduledScan to trigger the initial Scan")
	Eventually(func() bool {
		err := k8sClient.Get(ctx, types.NamespacedName{Name: "test-scan", Namespace: namespace}, &scheduledScan)
		if errors.IsNotFound(err) {
			panic("ScheduledScan should be present for this check!")
		}

		return scheduledScan.Status.LastScheduleTime != nil
	}, timeout, interval).Should(BeTrue())
}
