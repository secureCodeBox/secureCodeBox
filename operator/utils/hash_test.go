// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package utils

import (
	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var scanType executionv1.ScanType = executionv1.ScanType{
	ObjectMeta: metav1.ObjectMeta{
		Name:      "nmap",
		Namespace: "default",
	},
	Spec: executionv1.ScanTypeSpec{
		ExtractResults: executionv1.ExtractResults{
			Type:     "nmap-xml",
			Location: "/home/securecodebox/nmap-results.xml",
		},
		JobTemplate: batchv1.Job{
			Spec: batchv1.JobSpec{
				Template: corev1.PodTemplateSpec{
					Spec: corev1.PodSpec{
						Containers: []corev1.Container{
							{
								Name:  "foobar",
								Image: "securecodebox/scanner-nmap:7.91-r0",
								Command: []string{
									"nmap",
									"-oX",
									"/home/securecodebox/nmap-results.xml",
								},
							},
						},
					},
				},
				TTLSecondsAfterFinished: nil,
			},
		},
	}}

// Tests that getAnnotationsForScan drops all annotations not prefixed with "*.securecodebox.io/*"
var _ = Describe("ScanType Hashing", func() {
	Context("ScanType Hashing", func() {

		It("should hash scantype consistently", func() {
			hashValues := HashScanType(scanType)
			// note: this hash changes with every kubernetes release as kubernetes adds new field to their objects which causes the hashes to change.
			Expect(hashValues).To(Equal(uint64(0xba4b605a6550aca3)), "Should hash scantype consistently")
		})

		It("should ignore non-scb annotations on the scantypes", func() {
			originalScanType := scanType.DeepCopy()
			originalScanType.ObjectMeta.Annotations = map[string]string{
				"foo.example.com/bar": "54165165135",
			}

			modifiedScantype := scanType.DeepCopy()
			modifiedScantype.ObjectMeta.Annotations = map[string]string{
				"foo.example.com/bar": "719839183223",
			}

			Expect(HashScanType(*originalScanType)).To(Equal(HashScanType(*modifiedScantype)), "Should ignore non scb annotation on the scantypes")
		})

		It("should include scb annotations in the hash", func() {
			originalScanType := scanType.DeepCopy()
			originalScanType.ObjectMeta.Annotations = map[string]string{
				"foo.example.com/bar":                           "54165165135",
				"auto-discovery.securecodebox.io/scantype-hash": "same-hash",
			}

			modifiedScantype := scanType.DeepCopy()
			modifiedScantype.ObjectMeta.Annotations = map[string]string{
				"foo.example.com/bar":                           "719839183223",
				"auto-discovery.securecodebox.io/scantype-hash": "other-hash",
			}

			Expect(HashScanType(*originalScanType)).NotTo(Equal(HashScanType(*modifiedScantype)), "Should not equal as hash should include *.securecodebox.io/* annotations")
		})

		It("should ignore non-scb labels on the scantypes", func() {
			originalScanType := scanType.DeepCopy()
			originalScanType.ObjectMeta.Labels = map[string]string{
				"foo.example.com/bar": "54165165135",
			}

			modifiedScantype := scanType.DeepCopy()
			modifiedScantype.ObjectMeta.Labels = map[string]string{
				"foo.example.com/bar": "719839183223",
			}

			Expect(HashScanType(*originalScanType)).To(Equal(HashScanType(*modifiedScantype)), "Should ignore non scb labels on the scantypes")
		})

		It("should include scb labels in the hash", func() {
			originalScanType := scanType.DeepCopy()
			originalScanType.ObjectMeta.Labels = map[string]string{
				"foo.example.com/bar":                           "54165165135",
				"auto-discovery.securecodebox.io/scantype-hash": "same-hash",
			}

			modifiedScantype := scanType.DeepCopy()
			modifiedScantype.ObjectMeta.Labels = map[string]string{
				"foo.example.com/bar":                           "719839183223",
				"auto-discovery.securecodebox.io/scantype-hash": "other-hash",
			}

			Expect(HashScanType(*originalScanType)).NotTo(Equal(HashScanType(*modifiedScantype)), "Should not equal as hash should include *.securecodebox.io/* labels")
		})

		It("should ignore auto-generated attributes", func() {
			modifiedScantype := scanType.DeepCopy()

			modifiedScantype.ResourceVersion = "ajbsdiavof1t2hvasjhdvaj"

			Expect(HashScanType(scanType)).To(Equal(HashScanType(*modifiedScantype)), "Should ignore auto generated attributes")
		})
	})
})
