// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package main_test

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/aws/aws-sdk-go/aws/request"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/go-logr/logr"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/pkg/aws"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/pkg/config"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/pkg/kubernetes"
	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/envtest"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
)

// These tests use Ginkgo (BDD-style Go testing framework). Refer to
// http://onsi.github.io/ginkgo/ to learn more about Ginkgo.

// The main tests are integration tests for the whole autodicsovery service, which feed fake
// messages into the running AWSMonitor and then check the results of the actions taken by the
// Reconciler in kubernetes using envtest

const namespace = "go-tests"

var log logr.Logger
var k8sClient client.Client
var testEnv *envtest.Environment
var ctx context.Context
var cancel context.CancelFunc
var sqsapi *MockSQSService
var reconciler kubernetes.CloudReconciler
var awsMonitor *aws.MonitorService

func TestIntegration(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Integration Suite")
}

var _ = BeforeSuite(func() {
	log = zap.New(zap.WriteTo(GinkgoWriter), zap.UseDevMode(true))
	logf.SetLogger(log)

	ctx, cancel = context.WithCancel(context.TODO())

	By("bootstrapping test environment")
	testEnv = &envtest.Environment{
		CRDDirectoryPaths:     []string{filepath.Join("..", "..", "..", "..", "operator", "config", "crd", "bases")},
		ErrorIfCRDPathMissing: true,
	}

	cfg, err := testEnv.Start()
	Expect(err).NotTo(HaveOccurred())
	Expect(cfg).NotTo(BeNil())

	Expect(executionv1.AddToScheme(scheme.Scheme)).To(Succeed())

	k8sClient, err = client.New(cfg, client.Options{Scheme: scheme.Scheme})
	Expect(err).NotTo(HaveOccurred())
	Expect(k8sClient).NotTo(BeNil())

	Expect(createNamespace(ctx, namespace)).To(Succeed())
	Expect(createScanType(ctx, namespace)).To(Succeed())

	autoDiscoveryCfg := config.AutoDiscoveryConfig{
		Aws: config.AwsConfig{
			QueueUrl: "notaqueue",
			Region:   "doesnotmatter",
		},
		Kubernetes: config.KubernetesConfig{
			Namespace: namespace,
			ScanConfigs: []configv1.ScanConfig{
				{
					Name:           "test-scan",
					RepeatInterval: metav1.Duration{Duration: time.Hour},
					Annotations:    map[string]string{"testAnnotation": "{{ .Target.Id }}"},
					Labels:         map[string]string{"testLabel": "{{ .Target.Id }}"},
					Parameters:     []string{"{{ .ImageID }}"},
					ScanType:       "trivy-sbom-image",
					HookSelector: metav1.LabelSelector{
						MatchExpressions: []metav1.LabelSelectorRequirement{
							{
								Operator: metav1.LabelSelectorOpIn,
								Key:      "foo",
								Values:   []string{"bar", "baz"},
							},
							{
								Operator: metav1.LabelSelectorOpDoesNotExist,
								Key:      "foo",
							},
						},
					},
				},
				{
					Name:           "test-scan-two",
					RepeatInterval: metav1.Duration{Duration: time.Hour},
					Annotations:    map[string]string{"testAnnotation": "{{ .Target.Id }}"},
					Labels:         map[string]string{"testLabel": "{{ .Target.Id }}"},
					Parameters:     []string{"{{ .ImageID }}"},
					ScanType:       "trivy-sbom-image",
					HookSelector: metav1.LabelSelector{
						MatchExpressions: []metav1.LabelSelectorRequirement{
							{
								Operator: metav1.LabelSelectorOpIn,
								Key:      "foo",
								Values:   []string{"bar", "baz"},
							},
							{
								Operator: metav1.LabelSelectorOpDoesNotExist,
								Key:      "foo",
							},
						},
					},
				},
			},
		},
	}

	sqsapi = &MockSQSService{
		MsgEntry: make(chan *sqs.ReceiveMessageOutput),
	}

	reconciler = kubernetes.NewReconcilerWith(k8sClient, &autoDiscoveryCfg, log.WithName("kubernetes"))
	awsMonitor = aws.NewMonitorServiceWith(&autoDiscoveryCfg, sqsapi, reconciler, log.WithName("aws"))

	go func() {
		defer GinkgoRecover()
		awsMonitor.Run(ctx)
	}()
})

var _ = AfterSuite(func() {
	cancel()
	By("tearing down the test environment")
	Expect(testEnv.Stop()).To(Succeed())
})

func createNamespace(ctx context.Context, namespaceName string) error {
	namespace := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: namespaceName,
		},
	}

	return k8sClient.Create(ctx, namespace)
}

func createScanType(ctx context.Context, namespace string) error {
	scanType := &executionv1.ScanType{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "execution.securecodebox.io/v1",
			Kind:       "ScanType",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      "trivy-sbom-image",
			Namespace: namespace,
		},
		Spec: executionv1.ScanTypeSpec{
			ExtractResults: executionv1.ExtractResults{
				Location: "/home/securecodebox/sbom-cyclonedx.json",
				Type:     "sbom-cyclonedx",
			},
			JobTemplate: batchv1.Job{
				Spec: batchv1.JobSpec{
					Template: corev1.PodTemplateSpec{
						Spec: corev1.PodSpec{
							Containers: []corev1.Container{
								{
									Name:  "trivy-sbom",
									Image: "aquasec/trivy",
									Args: []string{
										"image",
										"--no-progress",
										"--format",
										"cyclonedx",
										"--output",
										"/home/securecodebox/sbom-cyclonedx.json",
									},
								},
							},
						},
					},
				},
			},
		},
	}

	return k8sClient.Create(ctx, scanType)
}

type MockSQSService struct {
	// MsgEntry can be used to insert messages into the mocked sqs interface where they will be
	// retrieved by the AWSMonitor
	MsgEntry chan *sqs.ReceiveMessageOutput
}

func (m *MockSQSService) ReceiveMessage(input *sqs.ReceiveMessageInput) (*sqs.ReceiveMessageOutput, error) {
	return m.ReceiveMessageWithContext(context.TODO(), input)
}

func (m *MockSQSService) ReceiveMessageWithContext(ctx context.Context, input *sqs.ReceiveMessageInput, opts ...request.Option) (*sqs.ReceiveMessageOutput, error) {
	timeout := time.After(time.Duration(*input.WaitTimeSeconds) * time.Second)
	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-timeout:
			return &sqs.ReceiveMessageOutput{}, nil
		case msg := <-m.MsgEntry:
			return msg, nil
		}
	}
}

func (*MockSQSService) DeleteMessage(input *sqs.DeleteMessageInput) (*sqs.DeleteMessageOutput, error) {
	// nothing to do because we don't actually store messages during the tests
	return &sqs.DeleteMessageOutput{}, nil
}

func (*MockSQSService) DeleteMessageWithContext(ctx context.Context, input *sqs.DeleteMessageInput, opts ...request.Option) (*sqs.DeleteMessageOutput, error) {
	// nothing to do because we don't actually store messages during the tests
	return &sqs.DeleteMessageOutput{}, nil
}
