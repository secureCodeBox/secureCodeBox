// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"path/filepath"
	"testing"
	"time"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
	. "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/controllers/container"
	. "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/controllers/cyclicimports"
	. "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/controllers/service"

	"k8s.io/client-go/kubernetes/scheme"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/envtest"
	"sigs.k8s.io/controller-runtime/pkg/envtest/printer"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"

	ctrl "sigs.k8s.io/controller-runtime"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	//+kubebuilder:scaffold:imports

	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
)

// These tests use Ginkgo (BDD-style Go testing framework). Refer to
// http://onsi.github.io/ginkgo/ to learn more about Ginkgo.

func TestAPIs(t *testing.T) {
	RegisterFailHandler(Fail)

	RunSpecsWithDefaultAndCustomReporters(t,
		"Controller Suite",
		[]Reporter{printer.NewlineReporter{}})
}

var _ = BeforeSuite(func() {

	logf.SetLogger(zap.New(zap.WriteTo(GinkgoWriter), zap.UseDevMode(true)))

	By("bootstrapping test environment")
	TestEnv = &envtest.Environment{
		CRDDirectoryPaths:     []string{filepath.Join("..", "config", "crd", "bases"), filepath.Join("..", "..", "..", "operator", "config", "crd", "bases")},
		ErrorIfCRDPathMissing: false,
	}

	cfg, err := TestEnv.Start()
	Expect(err).NotTo(HaveOccurred())
	Expect(cfg).NotTo(BeNil())

	err = executionv1.AddToScheme(scheme.Scheme)
	Expect(err).NotTo(HaveOccurred())

	//+kubebuilder:scaffold:scheme

	K8sClient, err = client.New(cfg, client.Options{Scheme: scheme.Scheme})
	Expect(err).NotTo(HaveOccurred())
	Expect(K8sClient).NotTo(BeNil())

	k8sManager, err := ctrl.NewManager(cfg, ctrl.Options{
		Scheme: scheme.Scheme,
	})
	Expect(err).ToNot(HaveOccurred())

	config := configv1.AutoDiscoveryConfig{
		Cluster: configv1.ClusterConfig{
			Name: "test-cluster",
		},
		ServiceAutoDiscoveryConfig: configv1.ServiceAutoDiscoveryConfig{
			PassiveReconcileInterval: metav1.Duration{Duration: 1 * time.Second},
			ScanConfig: configv1.ScanConfig{
				RepeatInterval: metav1.Duration{Duration: time.Hour},
				Annotations:    map[string]string{},
				Labels:         map[string]string{},
				Parameters:     []string{"-p", "{{ .Host.Port }}", "{{ .Service.Name }}.{{ .Service.Namespace }}.svc"},
				ScanType:       "nmap",
			},
		},
		ContainerAutoDiscoveryConfig: configv1.ContainerAutoDiscoveryConfig{
			ScanConfig: configv1.ScanConfig{
				RepeatInterval: metav1.Duration{Duration: time.Hour},
				Annotations:    map[string]string{"testAnnotation": "{{ .Config.ResourceInclusion.Mode }}"},
				Labels:         map[string]string{"testLabel": "{{ .Config.ResourceInclusion.Mode }}"},
				Parameters:     []string{"-p", "{{ .Config.ResourceInclusion.Mode }}"},
				ScanType:       "nmap",
			},
		},
		ResourceInclusion: configv1.ResourceInclusionConfig{
			Mode: configv1.EnabledPerResource,
		},
	}

	err = (&ServiceScanReconciler{
		Client:   k8sManager.GetClient(),
		Scheme:   k8sManager.GetScheme(),
		Recorder: k8sManager.GetEventRecorderFor("ServiceScanController"),
		Log:      ctrl.Log.WithName("controllers").WithName("ServiceScanController"),
		Config:   config,
	}).SetupWithManager(k8sManager)
	Expect(err).ToNot(HaveOccurred())

	err = (&ContainerScanReconciler{
		Client:   k8sManager.GetClient(),
		Scheme:   k8sManager.GetScheme(),
		Recorder: k8sManager.GetEventRecorderFor("ContainerScanController"),
		Log:      ctrl.Log.WithName("controllers").WithName("ContainerScanController"),
		Config:   config,
	}).SetupWithManager(k8sManager)
	Expect(err).ToNot(HaveOccurred())

	go func() {
		err = k8sManager.Start(ctrl.SetupSignalHandler())
		Expect(err).ToNot(HaveOccurred())
	}()
}, 60)

var _ = AfterSuite(func() {
	By("tearing down the test environment")
	err := TestEnv.Stop()
	Expect(err).NotTo(HaveOccurred())
})
