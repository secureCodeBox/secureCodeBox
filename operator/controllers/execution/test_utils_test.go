// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"context"
	"time"

	. "github.com/onsi/gomega"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"k8s.io/apimachinery/pkg/types"
	//+kubebuilder:scaffold:imports
)

func createNamespace(ctx context.Context, namespaceName string) {
	namespace := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: namespaceName,
		},
	}

	k8sClient.Create(ctx, namespace)
}

func createScanType(ctx context.Context, namespace string) {
	scanType := &executionv1.ScanType{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "execution.securecodebox.io/v1",
			Kind:       "ScanType",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      "nmap",
			Namespace: namespace,
		},
		Spec: executionv1.ScanTypeSpec{
			ExtractResults: executionv1.ExtractResults{
				Location: "/home/securecodebox/nmap.xml",
				Type:     "nmap-xml",
			},
			JobTemplate: batchv1.Job{
				Spec: batchv1.JobSpec{
					Template: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							Containers: []corev1.Container{
								{
									Name:  "nmap",
									Image: "securecodebox/scanner-nmap",
									Args:  []string{"-oX", "/home/securecodebox/nmap.xml"},
								},
							},
						},
					},
				},
			},
		},
	}
	Expect(k8sClient.Create(ctx, scanType)).Should(Succeed())
}

func createScheduledScan(ctx context.Context, namespace string, retriggerOnScanTypeChange bool) executionv1.ScheduledScan {
	scheduledScan := executionv1.ScheduledScan{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "test-scan",
			Namespace: namespace,
		},
		Spec: executionv1.ScheduledScanSpec{
			Interval:                  metav1.Duration{Duration: 42 * time.Hour},
			RetriggerOnScanTypeChange: retriggerOnScanTypeChange,
			ScanSpec: &executionv1.ScanSpec{
				ScanType:     "nmap",
				ResourceMode: executionv1.NamespaceLocal,
				Parameters:   []string{"scanme.nmap.org"},
			},
		},
	}
	Expect(k8sClient.Create(ctx, &scheduledScan)).Should(Succeed())

	Expect(k8sClient.Get(ctx, types.NamespacedName{Name: "test-scan", Namespace: namespace}, &scheduledScan)).Should(Succeed())

	return scheduledScan
}
