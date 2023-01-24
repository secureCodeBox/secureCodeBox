// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"context"
	"fmt"
	"hash/fnv"
	"reflect"
	"strconv"
	"time"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	//+kubebuilder:scaffold:imports
)

// These tests use Ginkgo (BDD-style Go testing framework). Refer to
// http://onsi.github.io/ginkgo/ to learn more about Ginkgo.

var _ = Describe("ContainerScan controller", func() {

	const (
		timeout  = time.Second * 10
		interval = time.Millisecond * 250
	)

	Context("Container autodiscovery for deployment", func() {

		namespace := "container-auto-discovery"
		ctx := context.Background()

		nginxScanName := "nginx-at-0d17b565c37bcbd895e9d92315a05c1c3c9a29f762b011a10c54a66cd53c9b31"
		nginxScanName = nginxScanName[:62]
		nginxScanGoTemplate := scanGoTemplate{
			map[string]string{"testAnnotation": namespace},
			map[string]string{
				"testLabel":                    namespace,
				"app.kubernetes.io/managed-by": "securecodebox-autodiscovery",
			},
			[]string{"-p", namespace},
			nil,
			nil,
			nil,
		}

		juiceShopScanName := "juice-shop-at-9342db143db5804dee3e64ff789be6ad8dd94f0491b2f50fa67c78be204081e2"
		juiceShopScanName = juiceShopScanName[:62]
		juiceShopScanGoTemplate := scanGoTemplate{
			map[string]string{"testAnnotation": namespace},
			map[string]string{
				"testLabel":                    namespace,
				"app.kubernetes.io/managed-by": "securecodebox-autodiscovery",
			},
			[]string{"-p", namespace},
			nil,
			nil,
			nil,
		}

		It("Should not create scans while the scan type is not installed", func() {
			createNamespace(ctx, namespace)
			fakeDeployment := map[string]string{"bkimminich/juice-shop": "9342db143db5804dee3e64ff789be6ad8dd94f0491b2f50fa67c78be204081e2",
				"nginx": "0d17b565c37bcbd895e9d92315a05c1c3c9a29f762b011a10c54a66cd53c9b31"}

			createPodWithMultipleContainers(ctx, "fake-deployment-pod1", namespace, fakeDeployment)
			createPodWithMultipleContainers(ctx, "fake-deployment-pod2", namespace, fakeDeployment)

			// scans should not be created because of the missing scan type
			Consistently(func() bool {
				return !checkIfScanExists(ctx, nginxScanName, namespace, nginxScanGoTemplate) &&
					!checkIfScanExists(ctx, juiceShopScanName, namespace, juiceShopScanGoTemplate)
			}, timeout, interval).Should(BeTrue())

		})

		It("Should create a single scheduledscan for every container with the same imageID in the deplyoment", func() {
			//install scantype, scans should be created now
			createScanType(ctx, namespace)

			Eventually(func() bool {
				return checkIfScanExists(ctx, nginxScanName, namespace, nginxScanGoTemplate) &&
					checkIfScanExists(ctx, juiceShopScanName, namespace, juiceShopScanGoTemplate)
			}, timeout, interval).Should(BeTrue())

		})

		It("Should not delete a scan if the container is still in use", func() {
			Expect(checkIfScanExists(ctx, nginxScanName, namespace, nginxScanGoTemplate)).To(BeTrue())
			Expect(checkIfScanExists(ctx, juiceShopScanName, namespace, juiceShopScanGoTemplate)).To(BeTrue())

			var podToBeDeleted corev1.Pod
			Expect(k8sClient.Get(ctx, types.NamespacedName{Name: "fake-deployment-pod2", Namespace: namespace}, &podToBeDeleted)).Should(Succeed())
			Expect(k8sClient.Delete(ctx, &podToBeDeleted)).Should(Succeed())

			//Scans should not be deleted, because one pod still uses the container images
			Consistently(func() bool {
				return checkIfScanExists(ctx, nginxScanName, namespace, nginxScanGoTemplate) &&
					checkIfScanExists(ctx, juiceShopScanName, namespace, juiceShopScanGoTemplate)
			}, timeout, interval).Should(BeTrue())
		})

		It("Should delete a scan if the container is not in use", func() {
			Expect(checkIfScanExists(ctx, nginxScanName, namespace, nginxScanGoTemplate)).To(BeTrue())
			Expect(checkIfScanExists(ctx, juiceShopScanName, namespace, juiceShopScanGoTemplate)).To(BeTrue())

			var podToBeDeleted corev1.Pod
			Expect(k8sClient.Get(ctx, types.NamespacedName{Name: "fake-deployment-pod1", Namespace: namespace}, &podToBeDeleted)).Should(Succeed())
			Expect(k8sClient.Delete(ctx, &podToBeDeleted)).Should(Succeed())

			//Scans should be deleted, invert checkIfScanExists
			Eventually(func() bool {
				return !checkIfScanExists(ctx, nginxScanName, namespace, nginxScanGoTemplate) &&
					!checkIfScanExists(ctx, juiceShopScanName, namespace, juiceShopScanGoTemplate)
			}, timeout, interval).Should(BeTrue())
		})
	})
	Context("Container autodiscovery with imagePullSecrets", func() {
		namespace := "container-autodiscovery-imagepullsecrets"
		ctx := context.Background()

		fakeDeployment := map[string]string{"nginx": "0d17b565c37bcbd895e9d92315a05c1c3c9a29f762b011a10c54a66cd53c9b31"}
		nginxScanName := "nginx-at-0d17b565c37bcbd895e9d92315a05c1c3c9a29f762b011a10c54a66cd53c9b31"
		nginxScanName = nginxScanName[:62]
		nginxScanGoTemplate := scanGoTemplate{
			map[string]string{"testAnnotation": namespace},
			map[string]string{
				"testLabel":                    namespace,
				"app.kubernetes.io/managed-by": "securecodebox-autodiscovery",
			},
			[]string{"-p", namespace},
			[]corev1.Container{
				{
					Name:  "secret-extraction-to-env",
					Image: "docker.io/securecodebox/auto-discovery-pull-secret-extractor",
					Args:  []string{"nginx@" + fakeDeployment["nginx"], ("temporary-secret-" + nginxScanName)[:62]},
					VolumeMounts: []corev1.VolumeMount{
						{
							Name:      "test-pull-secret-volume",
							MountPath: "/secrets/test-pull-secret",
						},
					},
				},
			},
			[]corev1.Volume{
				{
					Name: "test-pull-secret-volume",
					VolumeSource: corev1.VolumeSource{
						Secret: &corev1.SecretVolumeSource{
							SecretName: "test-pull-secret",
						},
					},
				},
			},
			[]corev1.EnvVar{
				{
					Name: "username",
					ValueFrom: &corev1.EnvVarSource{
						SecretKeyRef: &corev1.SecretKeySelector{
							LocalObjectReference: corev1.LocalObjectReference{
								Name: ("temporary-secret-" + nginxScanName)[:62],
							},
							Key: "username",
						},
					},
				},
				{
					Name: "password",
					ValueFrom: &corev1.EnvVarSource{
						SecretKeyRef: &corev1.SecretKeySelector{
							LocalObjectReference: corev1.LocalObjectReference{
								Name: ("temporary-secret-" + nginxScanName)[:62],
							},
							Key: "password",
						},
					},
				},
				{
					Name: "POD_NAME",
					ValueFrom: &corev1.EnvVarSource{
						FieldRef: &corev1.ObjectFieldSelector{
							FieldPath: "metadata.name",
						},
					},
				},
				{
					Name: "NAMESPACE",
					ValueFrom: &corev1.EnvVarSource{
						FieldRef: &corev1.ObjectFieldSelector{
							FieldPath: "metadata.namespace",
						},
					},
				},
			},
		}

		It("Should create a trivy scan with the secretExtractionInitContainer", func() {
			createNamespace(ctx, namespace)
			createScanType(ctx, namespace)

			imagePullSecrets := []corev1.LocalObjectReference{
				{
					Name: "test-pull-secret",
				},
			}
			createPodWithMultipleContainersAndImagePullSecrets(ctx, "fake-deployment-pod1", namespace, fakeDeployment, imagePullSecrets)

			Eventually(func() bool {
				return checkIfScanExists(ctx, nginxScanName, namespace, nginxScanGoTemplate)
			}, timeout, interval).Should(BeTrue())
		})
	})
})

func createPodWithMultipleContainers(ctx context.Context, name string, namespace string, images map[string]string) {
	createPodWithMultipleContainersAndImagePullSecrets(ctx, name, namespace, images, []corev1.LocalObjectReference{})
}
func createPodWithMultipleContainersAndImagePullSecrets(ctx context.Context, name string, namespace string, images map[string]string, imagePullSecrets []corev1.LocalObjectReference) {
	pod := &corev1.Pod{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "",
			Kind:       "Pod",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
			Annotations: map[string]string{
				"auto-discovery.securecodebox.io/enabled": "true",
			},
		},
		Spec: corev1.PodSpec{
			Containers:       getContainerSpec(name, images),
			ImagePullSecrets: imagePullSecrets,
		},
	}

	Expect(k8sClient.Create(ctx, pod)).Should(Succeed())
	setPodStatus(ctx, name, namespace, images)
}

func getContainerSpec(name string, images map[string]string) []corev1.Container {
	var result []corev1.Container

	nameCounter := 0
	for image := range images {
		containerName := strconv.Itoa(nameCounter)
		nameCounter++

		container := corev1.Container{Name: containerName, Image: image}
		result = append(result, container)
	}
	return result
}

func setPodStatus(ctx context.Context, name string, namespace string, images map[string]string) {
	var createdPod corev1.Pod
	Expect(k8sClient.Get(ctx, types.NamespacedName{Name: name, Namespace: namespace}, &createdPod)).Should(Succeed())
	var fakeContainerStatuses []corev1.ContainerStatus

	nameCounter := 0
	for image, digest := range images {

		imageID := fmt.Sprintf("some-useless-protocol://docker.io/doesntmatter/at/all/%s@sha256:%s", image, digest)
		containerID := fmt.Sprintf("docker://%d", hash(imageID))
		name := strconv.Itoa(nameCounter)
		nameCounter++

		container := corev1.ContainerStatus{

			Image:       image,
			ImageID:     imageID,
			ContainerID: containerID,
			Name:        name,
			Ready:       true,
		}

		fakeContainerStatuses = append(fakeContainerStatuses, container)
	}
	createdPod.Status.ContainerStatuses = fakeContainerStatuses
	Expect(k8sClient.Status().Update(ctx, &createdPod)).Should(Succeed())
}

func hash(s string) uint32 {
	h := fnv.New32a()
	h.Write([]byte(s))
	return h.Sum32()
}

func checkIfScanExists(ctx context.Context, name string, namespace string, scanSpec scanGoTemplate) bool {
	var scheduledScan executionv1.ScheduledScan
	err := k8sClient.Get(ctx, types.NamespacedName{Name: name, Namespace: namespace}, &scheduledScan)
	if errors.IsNotFound(err) {
		return false
	}
	return checkScanGoTemplate(scheduledScan, scanSpec)
}

func checkScanGoTemplate(scan executionv1.ScheduledScan, scanSpec scanGoTemplate) bool {
	annotations := scan.ObjectMeta.Annotations
	labels := scan.ObjectMeta.Labels
	parameters := scan.Spec.ScanSpec.Parameters
	volumes := scan.Spec.ScanSpec.Volumes
	envVars := scan.Spec.ScanSpec.Env

	annotationsCorrect := reflect.DeepEqual(annotations, scanSpec.Annotations)
	labelsCorrect := reflect.DeepEqual(labels, scanSpec.Labels)
	parametersCorrect := reflect.DeepEqual(parameters, scanSpec.Parameters)
	volumesCorrect := reflect.DeepEqual(volumes, scanSpec.Volumes)
	envVarsCorrect := reflect.DeepEqual(envVars, scanSpec.EnvVars)

	Expect(annotationsCorrect).Should(BeTrue())
	Expect(labelsCorrect).Should(BeTrue())
	Expect(parametersCorrect).Should(BeTrue())
	Expect(volumesCorrect).Should(BeTrue())
	Expect(envVarsCorrect).Should(BeTrue())
	Expect(scan.Spec.ScanSpec.HookSelector.MatchExpressions).To(ContainElement(
		metav1.LabelSelectorRequirement{
			Operator: metav1.LabelSelectorOpIn,
			Key:      "foo",
			Values:   []string{"bar", "baz"},
		},
	))
	Expect(scan.Spec.ScanSpec.HookSelector.MatchExpressions).To(ContainElement(
		metav1.LabelSelectorRequirement{

			Operator: metav1.LabelSelectorOpDoesNotExist,
			Key:      "foo",
		},
	))
	return annotationsCorrect && labelsCorrect && parametersCorrect
}

type scanGoTemplate struct {
	Annotations    map[string]string
	Labels         map[string]string
	Parameters     []string
	InitContainers []corev1.Container
	Volumes        []corev1.Volume
	EnvVars        []corev1.EnvVar
}
