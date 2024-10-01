// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

//go:build fast
// +build fast

package scancontrollers

import (
	"testing"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	batch "k8s.io/api/batch/v1"
)

func TestScanControllers(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "ScanControllers Suite")
}

var _ = Describe("ScanControllers", func() {
	Context("checkIfAllJobsCompleted", func() {
		It("should return completed if all jobs succeeded", func() {
			jobs := &batch.JobList{
				Items: []batch.Job{
					{
						Status: batch.JobStatus{
							Succeeded: 1,
						},
					},
					{
						Status: batch.JobStatus{
							Succeeded: 1,
						},
					},
				},
			}
			Expect(checkIfAllJobsCompleted(jobs)).To(Equal(completed))
		})

		It("should return incomplete if any job did not succeed", func() {
			jobs := &batch.JobList{
				Items: []batch.Job{
					{
						Status: batch.JobStatus{
							Succeeded: 1,
						},
					},
					{
						Status: batch.JobStatus{
							Succeeded: 0,
						},
					},
				},
			}
			Expect(checkIfAllJobsCompleted(jobs)).To(Equal(incomplete))
		})

		It("should return failed if any job exceeded backoff limit", func() {
			jobs := &batch.JobList{
				Items: []batch.Job{
					{
						Status: batch.JobStatus{
							Failed: 1,
							Conditions: []batch.JobCondition{
								{
									Reason: "BackoffLimitExceeded",
								},
							},
						},
					},
				},
			}
			Expect(checkIfAllJobsCompleted(jobs)).To(Equal(failed))
		})
	})

	Context("isBackoffLimitExceeded", func() {
		It("should return true if job exceeded backoff limit", func() {
			job := batch.Job{
				Status: batch.JobStatus{
					Failed: 1,
					Conditions: []batch.JobCondition{
						{
							Reason: "BackoffLimitExceeded",
						},
					},
				},
			}
			Expect(isBackoffLimitExceeded(job)).To(BeTrue())
		})

		It("should return false if job did not exceed backoff limit", func() {
			job := batch.Job{
				Status: batch.JobStatus{
					Failed: 1,
					Conditions: []batch.JobCondition{
						{
							Reason: "SomeOtherReason",
						},
					},
				},
			}
			Expect(isBackoffLimitExceeded(job)).To(BeFalse())
		})

		It("should return false if job did not fail", func() {
			job := batch.Job{
				Status: batch.JobStatus{
					Failed: 0,
				},
			}
			Expect(isBackoffLimitExceeded(job)).To(BeFalse())
		})
	})
})
