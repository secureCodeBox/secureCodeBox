// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"context"
	"fmt"
	"time"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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

			setupAutoDiscoveredApp(ctx, namespace)

			var scheduledScan executionv1.ScheduledScan
			err := k8sClient.Get(ctx, types.NamespacedName{Name: "juice-shop-service-port-3000", Namespace: namespace}, &scheduledScan)

			// set lastScheduled Time to ensure that the controller properly changes the timestamp
			now := metav1.Time{Time: time.Now()}
			scheduledScan.Status.LastScheduleTime = now.DeepCopy()
			err = k8sClient.Status().Update(ctx, &scheduledScan)
			if err != nil {
				panic(err)
			}

			// wait at least one second to ensure that the unix timestamps are at least one second apart.
			time.Sleep(1 * time.Second)

			By("Update ScanType to trigger rescan")

			var scanType executionv1.ScanType
			k8sClient.Get(ctx, types.NamespacedName{Name: "nmap", Namespace: namespace}, &scanType)

			if scanType.ObjectMeta.Annotations == nil {
				scanType.ObjectMeta.Annotations = map[string]string{}
			}
			scanType.ObjectMeta.Annotations["foobar.securecodebox.io/example"] = "barfoo"
			err = k8sClient.Update(ctx, &scanType)
			if err != nil {
				panic(err)
			}

			err = k8sClient.Get(ctx, types.NamespacedName{Name: "nmap", Namespace: namespace}, &scanType)
			if err != nil {
				panic(err)
			}

			By("Controller should set the lastScheduled Timestamp to the past to force a re-scan")
			Eventually(func() bool {
				err := k8sClient.Get(ctx, types.NamespacedName{Name: "juice-shop-service-port-3000", Namespace: namespace}, &scheduledScan)
				if errors.IsNotFound(err) {
					return false
				}

				return scheduledScan.Status.LastScheduleTime.Unix() != now.Unix()
			}, timeout, interval).Should(BeTrue())
		})
	})

	Context("Should not trigger rescan when ScanType stays the same", func() {
		It("Should restart a scheduledScan when the scantype was update", func() {
			ctx := context.Background()
			namespace := "scantype-no-autorestart-config-change-test"
			setupAutoDiscoveredApp(ctx, namespace)

			By("Update ScanType to trigger rescan")
			// set lastScheduled Time to ensure that the controller properly changes the timestamp
			var scheduledScan executionv1.ScheduledScan
			err := k8sClient.Get(ctx, types.NamespacedName{Name: "juice-shop-service-port-3000", Namespace: namespace}, &scheduledScan)
			if err != nil {
				panic(err)
			}
			now := metav1.Time{Time: time.Now()}
			scheduledScan.Status.LastScheduleTime = now.DeepCopy()
			err = k8sClient.Status().Update(ctx, &scheduledScan)
			if err != nil {
				panic(err)
			}

			By("Controller should not restart scheduledscan")
			Consistently(func() bool {
				var scheduledScan executionv1.ScheduledScan
				err := k8sClient.Get(ctx, types.NamespacedName{Name: "juice-shop-service-port-3000", Namespace: namespace}, &scheduledScan)
				if errors.IsNotFound(err) {
					return false
				}

				return scheduledScan.Status.LastScheduleTime.Unix() == now.Unix()
			}, timeout, interval).Should(BeTrue(), "Scan was restarted without need")
		})
	})
})

func setupAutoDiscoveredApp(ctx context.Context, namespaceName string) {
	// set up pod and service for auto-discovery
	createNamespace(ctx, namespaceName)
	createPod(ctx, "juice-shop", namespaceName, "bkimminich/juice-shop", "9342db143db5804dee3e64ff789be6ad8dd94f0491b2f50fa67c78be204081e2")
	createService(ctx, "juice-shop", namespaceName)
	createScanType(ctx, namespaceName)

	var scheduledScan executionv1.ScheduledScan
	// We'll need to retry getting this ScheduledScan, as the auto-discovery might take a couple of moment to discover the service and create the ScheduledScan for it.
	Eventually(func() bool {
		err := k8sClient.Get(ctx, types.NamespacedName{Name: "juice-shop-service-port-3000", Namespace: namespaceName}, &scheduledScan)
		if errors.IsNotFound(err) {
			return false
		}
		return true
	}, timeout, interval).Should(BeTrue())

	Expect(scheduledScan.ObjectMeta.Name).Should(Equal("juice-shop-service-port-3000"))
	Expect(scheduledScan.Spec.ScanSpec.ScanType).Should(Equal("nmap"))
	Expect(scheduledScan.Spec.ScanSpec.Parameters).Should(BeEquivalentTo([]string{"-p", "3000", fmt.Sprintf("juice-shop.%s.svc", namespaceName)}))
	Expect(scheduledScan.Status.LastScheduleTime).Should(BeNil())
}
