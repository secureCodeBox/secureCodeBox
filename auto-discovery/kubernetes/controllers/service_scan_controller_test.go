// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"context"
	"fmt"
	"time"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"

	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"

	//+kubebuilder:scaffold:imports

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
)

// These tests use Ginkgo (BDD-style Go testing framework). Refer to
// http://onsi.github.io/ginkgo/ to learn more about Ginkgo.

var _ = Describe("ServiceScan controller", func() {

	// Define utility constants for object names and testing timeouts and intervals.
	const (
		timeout  = time.Second * 10
		interval = time.Millisecond * 250
	)

	Context("Initial ServiceDiscovery", func() {
		It("Should create a ScheduledScan for each ScanConfig for Services with the correct annotation", func() {
			ctx := context.Background()
			namespace := "scan-creation"

			// Set up pod and service for auto-discovery
			createNamespace(ctx, namespace)
			createPod(ctx, "juice-shop", namespace, "bkimminich/juice-shop", "9342db143db5804dee3e64ff789be6ad8dd94f0491b2f50fa67c78be204081e2")
			createService(ctx, "juice-shop", namespace)
			createScanType(ctx, namespace)

			var scheduledScan0 executionv1.ScheduledScan
			var scheduledScan1 executionv1.ScheduledScan
			// Checking for the creation of the ScheduledScans for each ScanConfig
			var scanName0 = "juice-shop-service-test-scan-0-port-3000"
			var scanName1 = "juice-shop-service-test-scan-1-port-3000"

			// We'll need to retry getting this ScheduledScan, as the auto-discovery might take a couple of moment to discover the service and create the ScheduledScan for it.
			Eventually(func() bool {
				err := k8sClient.Get(ctx, types.NamespacedName{Name: scanName0, Namespace: namespace}, &scheduledScan0)
				err_2 := k8sClient.Get(ctx, types.NamespacedName{Name: scanName1, Namespace: namespace}, &scheduledScan1)
				if errors.IsNotFound(err) || errors.IsNotFound(err_2) {
					return false
				}
				return true
			}, timeout, interval).Should(BeTrue())

			Expect(scheduledScan0.ObjectMeta.Name).Should(Equal(scanName0))
			Expect(scheduledScan0.Spec.ScanSpec.ScanType).Should(Equal("nmap"))
			Expect(scheduledScan0.Spec.ScanSpec.Parameters).Should(BeEquivalentTo([]string{"-p", "3000", "juice-shop.scan-creation.svc"}))
			Expect(scheduledScan0.Spec.ScanSpec.HookSelector.MatchLabels).Should(BeEquivalentTo(map[string]string{
				"foo": "bar",
			}))
			Expect(scheduledScan0.Status.LastScheduleTime).Should(BeNil())

			Expect(scheduledScan1.ObjectMeta.Name).Should(Equal(scanName1))
			Expect(scheduledScan1.Spec.ScanSpec.ScanType).Should(Equal("nmap"))
			Expect(scheduledScan1.Spec.ScanSpec.Parameters).Should(BeEquivalentTo([]string{"-p", "3000", "juice-shop.scan-creation.svc"}))
			Expect(scheduledScan1.Spec.ScanSpec.HookSelector.MatchLabels).Should(BeEquivalentTo(map[string]string{
				"foo": "bar",
			}))
			Expect(scheduledScan1.Status.LastScheduleTime).Should(BeNil())

		})

		It("Should hold ScanCreation until all pod digests for the container backing the service match", func() {
			ctx := context.Background()
			namespace := "differing-digests"

			// Set up pod and service for auto-discovery
			createNamespace(ctx, namespace)
			createPod(ctx, "juice-shop-1", namespace, "bkimminich/juice-shop", "9342db143db5804dee3e64ff789be6ad8dd94f0491b2f50fa67c78be204081e2")
			createPod(ctx, "juice-shop-2", namespace, "bkimminich/juice-shop", "53ba8e4f1064ecc116849b21cef8eccdb90e7c3901cc3d739f2616cac125b3f1")
			createService(ctx, "juice-shop", namespace)
			createScanType(ctx, namespace)

			var scheduledScan0 executionv1.ScheduledScan
			var scheduledScan1 executionv1.ScheduledScan
			var scanName0 = "juice-shop-service-test-scan-0-port-3000"
			var scanName1 = "juice-shop-service-test-scan-1-port-3000"
			// We'll need to retry getting this ScheduledScan, as the auto-discovery might take a couple of moment to discover the service and create the ScheduledScan for it.
			Consistently(func() bool {
				err := k8sClient.Get(ctx, types.NamespacedName{Name: scanName0, Namespace: namespace}, &scheduledScan0)
				err_2 := k8sClient.Get(ctx, types.NamespacedName{Name: scanName1, Namespace: namespace}, &scheduledScan1)
				if errors.IsNotFound(err) && errors.IsNotFound(err_2) {
					return true
				}
				return false
			}, timeout, interval/2).Should(BeTrue())

			// Change Pod Digest of juice-shop-2 to match the first pod
			var pod corev1.Pod
			k8sClient.Get(ctx, types.NamespacedName{Name: "juice-shop-2", Namespace: namespace}, &pod)
			pod.Status.ContainerStatuses = []corev1.ContainerStatus{
				{
					Image:       "bkimminich/juice-shop",
					ImageID:     "docker-pullable://bkimminich/juice-shop@sha256:9342db143db5804dee3e64ff789be6ad8dd94f0491b2f50fa67c78be204081e2",
					ContainerID: "docker://53ba8e4f1064ecc116849b21cef8eccdb90e7c3901cc3d739f2616cac125b3f1",
					Ready:       true,
					Name:        "juice-shop",
				},
			}
			err := k8sClient.Status().Update(ctx, &pod)
			if err != nil {
				panic(err)
			}

			// ScheduledScan should now get created as both pods run on the same version
			// We'll need to retry getting this ScheduledScan, as the auto-discovery might take a couple of moment to discover the service and create the ScheduledScan for it.
			Eventually(func() bool {
				err := k8sClient.Get(ctx, types.NamespacedName{Name: scanName0, Namespace: namespace}, &scheduledScan0)
				err_2 := k8sClient.Get(ctx, types.NamespacedName{Name: scanName1, Namespace: namespace}, &scheduledScan1)
				if errors.IsNotFound(err) || errors.IsNotFound(err_2) {
					return false
				}
				return true
			}, timeout, interval).Should(BeTrue())

			Expect(scheduledScan0.ObjectMeta.Name).Should(Equal(scanName0))
			Expect(scheduledScan0.Spec.ScanSpec.ScanType).Should(Equal("nmap"))
			Expect(scheduledScan0.Spec.ScanSpec.Parameters).Should(BeEquivalentTo([]string{"-p", "3000", "juice-shop.differing-digests.svc"}))
			Expect(scheduledScan0.Status.LastScheduleTime).Should(BeNil())

			Expect(scheduledScan1.ObjectMeta.Name).Should(Equal(scanName1))
			Expect(scheduledScan1.Spec.ScanSpec.ScanType).Should(Equal("nmap"))
			Expect(scheduledScan1.Spec.ScanSpec.Parameters).Should(BeEquivalentTo([]string{"-p", "3000", "juice-shop.differing-digests.svc"}))
			Expect(scheduledScan1.Status.LastScheduleTime).Should(BeNil())
		})
	})

	Context("Update Detection ServiceDiscovery", func() {
		It("Should detect a upgraded pod and trigger a re-scan of the ScheduledScan", func() {
			ctx := context.Background()
			namespace := "update-test"

			// set up pod and service for auto-discovery
			createNamespace(ctx, namespace)
			createPod(ctx, "juice-shop", namespace, "bkimminich/juice-shop", "9342db143db5804dee3e64ff789be6ad8dd94f0491b2f50fa67c78be204081e2")
			createService(ctx, "juice-shop", namespace)
			createScanType(ctx, namespace)

			var scheduledScan0 executionv1.ScheduledScan
			var scheduledScan1 executionv1.ScheduledScan
			var scanName0 = "juice-shop-service-test-scan-0-port-3000"
			var scanName1 = "juice-shop-service-test-scan-1-port-3000"

			// We'll need to retry getting this ScheduledScan, as the auto-discovery might take a couple of moment to discover the service and create the ScheduledScan for it.
			Eventually(func() bool {
				err := k8sClient.Get(ctx, types.NamespacedName{Name: scanName0, Namespace: namespace}, &scheduledScan0)
				err_2 := k8sClient.Get(ctx, types.NamespacedName{Name: scanName1, Namespace: namespace}, &scheduledScan1)
				if errors.IsNotFound(err) || errors.IsNotFound(err_2) {
					return false
				}
				return true
			}, timeout, interval).Should(BeTrue())

			Expect(scheduledScan0.ObjectMeta.Name).Should(Equal(scanName0))
			Expect(scheduledScan0.Spec.ScanSpec.ScanType).Should(Equal("nmap"))
			Expect(scheduledScan0.Spec.ScanSpec.Parameters).Should(BeEquivalentTo([]string{"-p", "3000", "juice-shop.update-test.svc"}))
			Expect(scheduledScan0.Status.LastScheduleTime).Should(BeNil())

			Expect(scheduledScan1.ObjectMeta.Name).Should(Equal(scanName1))
			Expect(scheduledScan1.Spec.ScanSpec.ScanType).Should(Equal("nmap"))
			Expect(scheduledScan1.Spec.ScanSpec.Parameters).Should(BeEquivalentTo([]string{"-p", "3000", "juice-shop.update-test.svc"}))
			Expect(scheduledScan1.Status.LastScheduleTime).Should(BeNil())

			By("Update Pod to be of a new image revision")

			var pod corev1.Pod
			k8sClient.Get(ctx, types.NamespacedName{Name: "juice-shop", Namespace: namespace}, &pod)
			pod.Status.ContainerStatuses = []corev1.ContainerStatus{
				{
					Image:       "bkimminich/juice-shop:v12.8.0",
					ImageID:     "docker-pullable://bkimminich/juice-shop@sha256:01c8897aa847d13e97a650e315ceaa409883f6b762a14c4975a82bb6adafedf5",
					ContainerID: "docker://53ba8e4f1064ecc116849b21cef8eccdb90e7c3901cc3d739f2616cac125b3f1",
					Ready:       true,
					Name:        "juice-shop",
				},
			}
			err := k8sClient.Status().Update(ctx, &pod)
			if err != nil {
				panic(err)
			}

			By("Controller should set the lastScheduled Timestamp to the past to force a re-scan")
			Eventually(func() bool {
				err := k8sClient.Get(ctx, types.NamespacedName{Name: scanName0, Namespace: namespace}, &scheduledScan0)
				if errors.IsNotFound(err) {
					return false
				}
				return scheduledScan0.Status.LastScheduleTime != nil
			}, timeout, interval).Should(BeTrue())

			Eventually(func() bool {
				err := k8sClient.Get(ctx, types.NamespacedName{Name: scanName1, Namespace: namespace}, &scheduledScan1)
				if errors.IsNotFound(err) {
					return false
				}
				return scheduledScan1.Status.LastScheduleTime != nil
			}, timeout, interval).Should(BeTrue())

		})
	})
})

func createNamespace(ctx context.Context, namespaceName string) {
	namespace := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: namespaceName,
		},
	}

	err := k8sClient.Create(ctx, namespace)
	if err != nil {
		panic(err)
	}
}

func createPod(ctx context.Context, name string, namespace string, image string, imageDisgest string) {
	pod := &corev1.Pod{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "",
			Kind:       "Pod",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
			Labels: map[string]string{
				"app": "juice-shop",
			},
		},
		Spec: corev1.PodSpec{
			Containers: []corev1.Container{
				{
					Name:  name,
					Image: image,
					Ports: []corev1.ContainerPort{
						{
							Name:          "http",
							ContainerPort: 3000,
							Protocol:      corev1.ProtocolTCP,
						},
					},
				},
			},
		},
	}

	Expect(k8sClient.Create(ctx, pod)).Should(Succeed())

	// Set pod status
	var createdPod corev1.Pod
	k8sClient.Get(ctx, types.NamespacedName{Name: name, Namespace: namespace}, &createdPod)
	createdPod.Status.ContainerStatuses = []corev1.ContainerStatus{
		{
			Image:       image,
			ImageID:     fmt.Sprintf("docker-pullable://%s@sha256:%s", image, imageDisgest),
			ContainerID: "docker://53ba8e4f1064ecc116849b21cef8eccdb90e7c3901cc3d739f2616cac125b3f1",
			Name:        "juice-shop",
			Ready:       true,
		},
	}
	Expect(k8sClient.Status().Update(ctx, &createdPod)).Should(Succeed())
}
func createService(ctx context.Context, name string, namespace string) {
	service := &corev1.Service{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "",
			Kind:       "Service",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
			Labels: map[string]string{
				"app": name,
			},
			Annotations: map[string]string{
				"auto-discovery.securecodebox.io/enabled": "true",
			},
		},
		Spec: corev1.ServiceSpec{
			Selector: map[string]string{
				"app": name,
			},
			Ports: []corev1.ServicePort{
				{
					Name:     "http",
					Port:     3000,
					Protocol: corev1.ProtocolTCP,
				},
			},
		},
	}
	Expect(k8sClient.Create(ctx, service)).Should(Succeed())
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
