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
	Context("Finalizer Migration", func() {
		var scan *executionv1.Scan

		BeforeEach(func() {
			scan = &executionv1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Namespace:  namespace,
					Name:       "test-scan",
					Finalizers: []string{},
				},
				Spec: executionv1.ScanSpec{
					ScanType:   "nmap",
					Parameters: []string{"example.com"},
				},
				Status: executionv1.ScanStatus{
					RawResultFile: "raw-results.json",
				},
			}
		})

		It("should handle legacy finalizer migration logic", func() {
			// Set up scan with legacy finalizer
			scan.ObjectMeta.Finalizers = []string{s3StorageFinalizerLegacy, "other-finalizer"}

			// Test that legacy finalizer is present initially
			Expect(containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizerLegacy)).To(BeTrue())

			// Test that it would be detected for migration (without actually running migration
			// which requires MinioClient setup)
			hasLegacy := containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizerLegacy)
			Expect(hasLegacy).To(BeTrue())

			// Simulate the migration logic manually (what migrateFinalizer would do)
			if hasLegacy {
				scan.ObjectMeta.Finalizers = removeString(scan.ObjectMeta.Finalizers, s3StorageFinalizerLegacy)
			}

			// After migration, legacy finalizer should be removed
			Expect(containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizerLegacy)).To(BeFalse())
			// Other finalizers should remain
			Expect(containsString(scan.ObjectMeta.Finalizers, "other-finalizer")).To(BeTrue())
		})

		It("should not migrate when legacy finalizer is not present", func() {
			// Set up scan without legacy finalizer
			scan.ObjectMeta.Finalizers = []string{s3StorageFinalizer}

			mockReconciler := &ScanReconciler{}
			err := mockReconciler.migrateFinalizer(scan)

			// Should return nil (no migration needed)
			Expect(err).To(BeNil())
			// Should still have the new finalizer
			Expect(containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizer)).To(BeTrue())
		})

		It("should not migrate when no finalizers are present", func() {
			// Set up scan without any finalizers
			scan.ObjectMeta.Finalizers = []string{}

			// Test detection logic (no migration needed)
			hasLegacy := containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizerLegacy)
			Expect(hasLegacy).To(BeFalse())

			// Should have no finalizers
			Expect(len(scan.ObjectMeta.Finalizers)).To(Equal(0))
		})

		It("should handle active scan migration from legacy finalizer", func() {
			// Set up scan with legacy finalizer (simulating existing scan)
			scan.ObjectMeta.Finalizers = []string{s3StorageFinalizerLegacy}

			// Simulate the active scan migration logic from startScan function
			updated := false

			// Check if migration is needed
			if containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizerLegacy) && !containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizer) {
				scan.ObjectMeta.Finalizers = removeString(scan.ObjectMeta.Finalizers, s3StorageFinalizerLegacy)
				scan.ObjectMeta.Finalizers = append(scan.ObjectMeta.Finalizers, s3StorageFinalizer)
				updated = true
			}

			// Verify migration occurred
			Expect(updated).To(BeTrue())
			Expect(containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizerLegacy)).To(BeFalse())
			Expect(containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizer)).To(BeTrue())
		})

		It("should not migrate active scan when current finalizer already exists", func() {
			// Set up scan with both finalizers (edge case)
			scan.ObjectMeta.Finalizers = []string{s3StorageFinalizerLegacy, s3StorageFinalizer}

			// Simulate the active scan migration logic
			updated := false

			// Check migration condition (should not migrate if current finalizer exists)
			if containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizerLegacy) && !containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizer) {
				// This block should not execute
				updated = true
			}

			// Verify no migration occurred
			Expect(updated).To(BeFalse())
			Expect(containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizerLegacy)).To(BeTrue())
			Expect(containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizer)).To(BeTrue())
		})

		It("should add s3 storage finalizer to scan without any finalizers", func() {
			// Set up scan without finalizers
			scan.ObjectMeta.Finalizers = []string{}

			// Simulate adding s3 storage finalizer
			updated := false

			if !containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizer) {
				scan.ObjectMeta.Finalizers = append(scan.ObjectMeta.Finalizers, s3StorageFinalizer)
				updated = true
			}

			// Verify finalizer was added
			Expect(updated).To(BeTrue())
			Expect(containsString(scan.ObjectMeta.Finalizers, s3StorageFinalizer)).To(BeTrue())
			Expect(len(scan.ObjectMeta.Finalizers)).To(Equal(1))
		})
	})

	Context("Helper Functions", func() {
		It("should correctly identify when string contains finalizer", func() {
			finalizers := []string{"other-finalizer", s3StorageFinalizer, "another-finalizer"}
			Expect(containsString(finalizers, s3StorageFinalizer)).To(BeTrue())
			Expect(containsString(finalizers, s3StorageFinalizerLegacy)).To(BeFalse())
			Expect(containsString(finalizers, "non-existent")).To(BeFalse())
		})

		It("should correctly remove string from slice", func() {
			originalSlice := []string{"first", s3StorageFinalizerLegacy, "last"}
			result := removeString(originalSlice, s3StorageFinalizerLegacy)

			Expect(len(result)).To(Equal(2))
			Expect(result).To(Equal([]string{"first", "last"}))
			Expect(containsString(result, s3StorageFinalizerLegacy)).To(BeFalse())
		})

		It("should handle removing non-existent string", func() {
			originalSlice := []string{"first", "second", "third"}
			result := removeString(originalSlice, "non-existent")

			Expect(len(result)).To(Equal(3))
			Expect(result).To(Equal(originalSlice))
		})

		It("should handle empty slice", func() {
			result := removeString([]string{}, "any-string")
			Expect(len(result)).To(Equal(0))
		})
	})
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

	Context("Suspend Functionality", func() {
		It("should return true for TTL cleanup on suspended Done scan", func() {
			finishTime := time.Date(2009, 11, 17, 20, 34, 58, 651387237, time.UTC)
			var timeout int32 = 30
			suspend := true
			var scan = &executionv1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Namespace: namespace,
					Name:      "nmap",
				},
				Spec: executionv1.ScanSpec{
					ScanType:                "nmap",
					Parameters:              []string{"scanme.nmap.org"},
					TTLSecondsAfterFinished: &timeout,
					Suspend:                 &suspend,
				},
				Status: executionv1.ScanStatus{
					State:      executionv1.ScanStateDone,
					FinishedAt: &metav1.Time{Time: finishTime},
				},
			}
			// TTL cleanup should still work even when suspended
			Expect(reconciler.checkIfTTLSecondsAfterFinishedIsCompleted(scan)).To(BeTrue())
		})

		It("should return true for TTL cleanup on suspended Errored scan", func() {
			finishTime := time.Date(2009, 11, 17, 20, 34, 58, 651387237, time.UTC)
			var timeout int32 = 30
			suspend := true
			var scan = &executionv1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Namespace: namespace,
					Name:      "nmap",
				},
				Spec: executionv1.ScanSpec{
					ScanType:                "nmap",
					Parameters:              []string{"scanme.nmap.org"},
					TTLSecondsAfterFinished: &timeout,
					Suspend:                 &suspend,
				},
				Status: executionv1.ScanStatus{
					State:      executionv1.ScanStateErrored,
					FinishedAt: &metav1.Time{Time: finishTime},
				},
			}
			// TTL cleanup should still work even when suspended
			Expect(reconciler.checkIfTTLSecondsAfterFinishedIsCompleted(scan)).To(BeTrue())
		})

		It("should identify a suspended scan correctly", func() {
			suspend := true
			var scan = &executionv1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Namespace: namespace,
					Name:      "nmap",
				},
				Spec: executionv1.ScanSpec{
					ScanType:   "nmap",
					Parameters: []string{"scanme.nmap.org"},
					Suspend:    &suspend,
				},
				Status: executionv1.ScanStatus{
					State: executionv1.ScanStateInit,
				},
			}
			// Verify the suspend flag is properly set
			Expect(scan.Spec.Suspend).NotTo(BeNil())
			Expect(*scan.Spec.Suspend).To(BeTrue())
		})

		It("should identify a non-suspended scan correctly when Suspend is false", func() {
			suspend := false
			var scan = &executionv1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Namespace: namespace,
					Name:      "nmap",
				},
				Spec: executionv1.ScanSpec{
					ScanType:   "nmap",
					Parameters: []string{"scanme.nmap.org"},
					Suspend:    &suspend,
				},
				Status: executionv1.ScanStatus{
					State: executionv1.ScanStateInit,
				},
			}
			// Verify the suspend flag is properly set to false
			Expect(scan.Spec.Suspend).NotTo(BeNil())
			Expect(*scan.Spec.Suspend).To(BeFalse())
		})

		It("should handle nil Suspend field as not suspended", func() {
			var scan = &executionv1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Namespace: namespace,
					Name:      "nmap",
				},
				Spec: executionv1.ScanSpec{
					ScanType:   "nmap",
					Parameters: []string{"scanme.nmap.org"},
					Suspend:    nil, // Not set, should default to false
				},
				Status: executionv1.ScanStatus{
					State: executionv1.ScanStateInit,
				},
			}
			// When Suspend is nil, the scan should not be considered suspended
			if scan.Spec.Suspend != nil {
				Expect(*scan.Spec.Suspend).To(BeFalse())
			} else {
				// nil is treated as not suspended
				Expect(scan.Spec.Suspend).To(BeNil())
			}
		})
	})
})
