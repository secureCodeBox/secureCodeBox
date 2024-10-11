// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

//go:build fast
// +build fast

package scancontrollers

import (
	"time"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var namespace = "test-namespace"
var reconciler = &ScanReconciler{}
var _ = Describe("ScanControllers", func() {
	Context("checkIfTTLSecondsAfterFinishedIsCompleted", func() {
		It("should return true if TTLSecondsAfterFinished is set", func() {
			finishTime := time.Date(
				2009, 11, 17, 20, 34, 58, 651387237, time.UTC)
			var timeout int32 = 30
			var scan = &executionv1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Namespace: namespace,
					Name:      "nmap",
				},
				Spec: executionv1.ScanSpec{
					ScanType:                "nmap",
					Parameters:              []string{"scanme.nmap.org"},
					TTLSecondsAfterFinished: &timeout,
				},
				Status: executionv1.ScanStatus{
					FinishedAt: &metav1.Time{Time: finishTime},
				},
			}
			Expect(reconciler.checkIfTTLSecondsAfterFinishedIsCompleted(scan)).To(BeTrue())
		})

		It("should return false if TTLSecondsAfterFinished is not set", func() {
			var scan = &executionv1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Namespace: namespace,
					Name:      "nmap",
				},
				Spec: executionv1.ScanSpec{
					ScanType:   "nmap",
					Parameters: []string{"scanme.nmap.org"},
				},
			}
			Expect(reconciler.checkIfTTLSecondsAfterFinishedIsCompleted(scan)).To(BeFalse())
		})

		It("should return false if TTLSecondsAfterFinished is not timed out", func() {
			finishTime := time.Now()
			var timeout int32 = 300
			var scan = &executionv1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Namespace: namespace,
					Name:      "nmap",
				},
				Spec: executionv1.ScanSpec{
					ScanType:                "nmap",
					Parameters:              []string{"scanme.nmap.org"},
					TTLSecondsAfterFinished: &timeout,
				},
				Status: executionv1.ScanStatus{
					FinishedAt: &metav1.Time{Time: finishTime},
				},
			}
			Expect(reconciler.checkIfTTLSecondsAfterFinishedIsCompleted(scan)).To(BeFalse())
		})

	})
})
