// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package util

import (
	"path/filepath"
	"time"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"

	"github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/pkg/config"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var _ = Describe("LoadAutoDiscoveryConfig", func() {
	Context("With a fully filled valid config file", func() {
		It("Should unmarshal all configuration fields as expected", func() {
			testFile := filepath.Join("__testfiles__", "valid_config_test.yaml")

			cfg, err := LoadAutoDiscoveryConfig(testFile)
			Expect(err).ShouldNot(HaveOccurred())
			Expect(cfg).ShouldNot(BeNil())

			// Check TypeMeta.
			Expect(cfg.APIVersion).To(Equal("config.securecodebox.io/v1"))
			Expect(cfg.Kind).To(Equal("AutoDiscoveryConfig"))

			// Check Cluster.
			Expect(cfg.Cluster.Name).To(Equal("docker-desktop"))

			// Check ResourceInclusion.
			Expect(cfg.ResourceInclusion.Mode).To(Equal(config.EnabledPerNamespace))

			// Check ServiceAutoDiscovery configuration.
			sad := cfg.ServiceAutoDiscovery
			Expect(sad.Enabled).To(BeTrue())
			// The YAML specifies "1m" which should parse to time.Minute.
			Expect(sad.PassiveReconcileInterval.Duration).To(Equal(time.Minute))
			// Expect one scan configuration.
			Expect(sad.ScanConfigs).To(HaveLen(1))

			sc := sad.ScanConfigs[0]
			Expect(sc.Name).To(Equal("zap"))
			Expect(sc.ScanType).To(Equal("zap-automation-framework"))
			Expect(sc.RepeatInterval.Duration).To(Equal(168 * time.Hour))
			Expect(sc.Parameters).To(Equal([]string{
				"-autorun",
				"/home/securecodebox/scb-automation/automation.yaml",
			}))
			Expect(sc.Labels).To(BeEmpty())
			Expect(sc.Annotations).To(HaveKeyWithValue("defectdojo.securecodebox.io/product-name", "{{ .Cluster.Name }} | {{ .Namespace.Name }} | {{ .Target.Name }}"))
			Expect(sc.Annotations).To(HaveKeyWithValue("defectdojo.securecodebox.io/product-tags", "cluster/{{ .Cluster.Name }},namespace/{{ .Namespace.Name }}"))
			Expect(sc.Annotations).To(HaveKeyWithValue("defectdojo.securecodebox.io/engagement-name", "{{ .Target.Name }}"))
			Expect(sc.Annotations).To(HaveKeyWithValue("defectdojo.securecodebox.io/engagement-version", "{{if (index .Target.Labels `app.kubernetes.io/version`) }}{{ index .Target.Labels `app.kubernetes.io/version` }}{{end}}"))

			// Validate volumes of the service scan config.
			Expect(sc.Volumes).To(HaveLen(1))
			vol := sc.Volumes[0]
			Expect(vol.Name).To(Equal("zap-automation-framework-baseline-config"))
			Expect(vol.ConfigMap).NotTo(BeNil())
			cm := vol.ConfigMap
			// The ConfigMap volume source.
			Expect(cm.Name).To(Equal("zap-automation-framework-baseline-config"))
			// Optional is a pointer.
			Expect(*cm.Optional).To(BeTrue())
			Expect(*cm.DefaultMode).To(Equal(int32(420)))
			Expect(cm.Items).To(HaveLen(2))
			// First key-to-path mapping.
			firstItem := cm.Items[0]
			Expect(firstItem.Key).To(Equal("automation.yaml"))
			Expect(firstItem.Path).To(Equal("automation.yaml"))
			Expect(*firstItem.Mode).To(Equal(int32(420)))
			// Second key-to-path mapping.
			secondItem := cm.Items[1]
			Expect(secondItem.Key).To(Equal("extra-config.yaml"))
			Expect(secondItem.Path).To(Equal("extra-config.yaml"))
			Expect(*secondItem.Mode).To(Equal(int32(511)))

			// Validate volumeMounts of the service scan config.
			Expect(sc.VolumeMounts).To(HaveLen(1))
			vm := sc.VolumeMounts[0]
			Expect(vm.Name).To(Equal("zap-automation-framework-baseline-config"))
			Expect(vm.ReadOnly).To(BeTrue())
			// recursiveReadOnly is a pointer to a string in the struct.
			Expect(*vm.RecursiveReadOnly).To(Equal(corev1.RecursiveReadOnlyEnabled))
			Expect(vm.MountPath).To(Equal("/home/securecodebox/configs/automation.yaml"))
			Expect(vm.SubPath).To(Equal("automation.yaml"))
			// mountPropagation is also a pointer.
			Expect(*vm.MountPropagation).To(Equal(corev1.MountPropagationBidirectional))
			Expect(vm.SubPathExpr).To(Equal("$(CONFIG_FILE_NAME)"))

			// Validate hookSelector: matchLabels and matchExpressions.
			Expect(sc.HookSelector.MatchLabels).To(HaveKeyWithValue("hook", "zap-scan"))
			Expect(sc.HookSelector.MatchExpressions).To(HaveLen(2))

			// Validate first matchExpression.
			scme1 := sc.HookSelector.MatchExpressions[0]
			Expect(scme1.Key).To(Equal("environment"))
			Expect(scme1.Operator).To(Equal(metav1.LabelSelectorOpIn))
			Expect(scme1.Values).To(ConsistOf("prod", "staging"))

			// Validate second matchExpression.
			scme2 := sc.HookSelector.MatchExpressions[1]
			Expect(scme2.Key).To(Equal("tier"))
			Expect(scme2.Operator).To(Equal(metav1.LabelSelectorOpNotIn))
			Expect(scme2.Values).To(ConsistOf("frontend"))

			// Validate environment variables.
			Expect(sc.Env).To(HaveLen(2))

			// Validate first environment variable.
			scenv1 := sc.Env[0]
			Expect(scenv1.Name).To(Equal("ZAP_TARGET"))
			Expect(scenv1.Value).To(Equal("http://example.com"))
			Expect(scenv1.ValueFrom).To(BeNil())

			// Validate second environment variable
			scenv2 := sc.Env[1]
			Expect(scenv2.Name).To(Equal("COMPLEX_ENV"))
			Expect(scenv2.Value).To(Equal("http://example.com"))

			Expect(scenv2.ValueFrom).NotTo(BeNil())
			vf := scenv2.ValueFrom

			// Validate fieldRef.
			Expect(vf.FieldRef).NotTo(BeNil())
			Expect(vf.FieldRef.APIVersion).To(Equal("v1"))
			Expect(vf.FieldRef.FieldPath).To(Equal("metadata.name"))

			// Validate resourceFieldRef.
			Expect(vf.ResourceFieldRef).NotTo(BeNil())
			Expect(vf.ResourceFieldRef.ContainerName).To(Equal("my-container"))
			Expect(vf.ResourceFieldRef.Resource).To(Equal("limits.cpu"))
			// Check that the divisor string is "10".
			Expect(vf.ResourceFieldRef.Divisor.String()).To(Equal("10"))

			// Validate configMapKeyRef.
			Expect(vf.ConfigMapKeyRef).NotTo(BeNil())
			Expect(vf.ConfigMapKeyRef.Name).To(Equal("my-configmap"))
			Expect(vf.ConfigMapKeyRef.Key).To(Equal("my-key"))
			Expect(vf.ConfigMapKeyRef.Optional).NotTo(BeNil())
			Expect(*vf.ConfigMapKeyRef.Optional).To(BeFalse())

			// Validate secretKeyRef.
			Expect(vf.SecretKeyRef).NotTo(BeNil())
			Expect(vf.SecretKeyRef.Name).To(Equal("my-secret"))
			Expect(vf.SecretKeyRef.Key).To(Equal("my-secret-key"))
			Expect(vf.SecretKeyRef.Optional).NotTo(BeNil())
			Expect(*vf.SecretKeyRef.Optional).To(BeTrue())

			// Check ContainerAutoDiscovery configuration.
			cad := cfg.ContainerAutoDiscovery
			Expect(cad.Enabled).To(BeFalse())
			Expect(cad.PassiveReconcileInterval.Duration).To(Equal(time.Minute))

			// Validate ImagePullSecretConfig.
			ipc := cad.ImagePullSecretConfig
			Expect(ipc.MapImagePullSecretsToEnvironmentVariables).To(BeTrue())
			Expect(ipc.UsernameEnvironmentVariableName).To(Equal("TRIVY_USERNAME"))
			Expect(ipc.PasswordNameEnvironmentVariableName).To(Equal("TRIVY_PASSWORD"))

			// Expect one scan configuration.
			Expect(cad.ScanConfigs).To(HaveLen(1))
			sc2 := cad.ScanConfigs[0]
			Expect(sc2.Name).To(Equal("trivy"))
			Expect(sc2.ScanType).To(Equal("trivy-image-autodiscovery"))
			Expect(sc2.RepeatInterval.Duration).To(Equal(168 * time.Hour))
			Expect(sc2.Parameters).To(Equal([]string{"{{ .ImageID }}"}))
			Expect(sc2.Labels).To(BeEmpty())
			Expect(sc2.Annotations).To(HaveKeyWithValue("defectdojo.securecodebox.io/product-name", "{{ .Cluster.Name }} | {{ .Namespace.Name }} | {{ .Target.Name }}"))
			Expect(sc2.Annotations).To(HaveKeyWithValue("defectdojo.securecodebox.io/product-tags", "cluster/{{ .Cluster.Name }},namespace/{{ .Namespace.Name }}"))
			Expect(sc2.Annotations).To(HaveKeyWithValue("defectdojo.securecodebox.io/engagement-name", "{{ .Target.Name }}"))
			Expect(sc2.Annotations).To(HaveKeyWithValue("defectdojo.securecodebox.io/engagement-version", "{{if (index .Target.Labels `app.kubernetes.io/version`) }}{{ index .Target.Labels `app.kubernetes.io/version` }}{{end}}"))

			// Validate volumes of the container scan config.
			Expect(sc2.Volumes).To(HaveLen(1))
			vol2 := sc2.Volumes[0]
			Expect(vol2.Name).To(Equal("zap-automation-framework-baseline-config"))
			Expect(vol2.ConfigMap).NotTo(BeNil())
			cm2 := vol2.ConfigMap
			Expect(cm2.Name).To(Equal("zap-automation-framework-baseline-config"))
			Expect(*cm2.Optional).To(BeTrue())
			Expect(*cm2.DefaultMode).To(Equal(int32(420)))
			Expect(cm2.Items).To(HaveLen(2))
			firstItem = cm2.Items[0]
			Expect(firstItem.Key).To(Equal("automation.yaml"))
			Expect(firstItem.Path).To(Equal("automation.yaml"))
			Expect(*firstItem.Mode).To(Equal(int32(420)))
			secondItem = cm2.Items[1]
			Expect(secondItem.Key).To(Equal("extra-config.yaml"))
			Expect(secondItem.Path).To(Equal("extra-config.yaml"))
			Expect(*secondItem.Mode).To(Equal(int32(511)))

			// Validate volumeMounts of the container scan config.
			Expect(sc2.VolumeMounts).To(HaveLen(1))
			vm = sc2.VolumeMounts[0]
			Expect(vm.Name).To(Equal("zap-automation-framework-baseline-config"))
			Expect(vm.ReadOnly).To(BeTrue())
			Expect(*vm.RecursiveReadOnly).To(Equal(corev1.RecursiveReadOnlyEnabled))
			Expect(vm.MountPath).To(Equal("/home/securecodebox/configs/automation.yaml"))
			Expect(vm.SubPath).To(Equal("automation.yaml"))
			Expect(*vm.MountPropagation).To(Equal(corev1.MountPropagationBidirectional))
			Expect(vm.SubPathExpr).To(Equal("$(CONFIG_FILE_NAME)"))

			// Validate hookSelector: matchLabels and matchExpressions.
			Expect(sc2.HookSelector.MatchLabels).To(HaveKeyWithValue("hook", "zap-scan"))
			Expect(sc2.HookSelector.MatchExpressions).To(HaveLen(2))

			// Validate first matchExpression.
			sc2me1 := sc2.HookSelector.MatchExpressions[0]
			Expect(sc2me1.Key).To(Equal("environment"))
			Expect(sc2me1.Operator).To(Equal(metav1.LabelSelectorOpIn))
			Expect(sc2me1.Values).To(ConsistOf("prod", "staging"))

			// Validate second matchExpression.
			sc2me2 := sc2.HookSelector.MatchExpressions[1]
			Expect(sc2me2.Key).To(Equal("tier"))
			Expect(sc2me2.Operator).To(Equal(metav1.LabelSelectorOpNotIn))
			Expect(sc2me2.Values).To(ConsistOf("frontend"))

			// Validate environment variables.
			Expect(sc2.Env).To(HaveLen(2))

			// Validate first environment variable.
			sc2env1 := sc2.Env[0]
			Expect(sc2env1.Name).To(Equal("ZAP_TARGET"))
			Expect(sc2env1.Value).To(Equal("http://example.com"))
			Expect(sc2env1.ValueFrom).To(BeNil())

			// Validate second environment variable
			sc2env2 := sc2.Env[1]
			Expect(sc2env2.Name).To(Equal("COMPLEX_ENV"))
			Expect(sc2env2.Value).To(Equal("http://example.com"))

			Expect(sc2env2.ValueFrom).NotTo(BeNil())
			vf2 := sc2env2.ValueFrom

			// Validate fieldRef.
			Expect(vf2.FieldRef).NotTo(BeNil())
			Expect(vf2.FieldRef.APIVersion).To(Equal("v1"))
			Expect(vf2.FieldRef.FieldPath).To(Equal("metadata.name"))

			// Validate resourceFieldRef.
			Expect(vf2.ResourceFieldRef).NotTo(BeNil())
			Expect(vf2.ResourceFieldRef.ContainerName).To(Equal("my-container"))
			Expect(vf2.ResourceFieldRef.Resource).To(Equal("limits.cpu"))
			// Check that the divisor string is "10".
			Expect(vf2.ResourceFieldRef.Divisor.String()).To(Equal("10"))

			// Validate configMapKeyRef.
			Expect(vf2.ConfigMapKeyRef).NotTo(BeNil())
			Expect(vf2.ConfigMapKeyRef.Name).To(Equal("my-configmap"))
			Expect(vf2.ConfigMapKeyRef.Key).To(Equal("my-key"))
			Expect(vf2.ConfigMapKeyRef.Optional).NotTo(BeNil())
			Expect(*vf2.ConfigMapKeyRef.Optional).To(BeFalse())

			// Validate secretKeyRef.
			Expect(vf2.SecretKeyRef).NotTo(BeNil())
			Expect(vf2.SecretKeyRef.Name).To(Equal("my-secret"))
			Expect(vf2.SecretKeyRef.Key).To(Equal("my-secret-key"))
			Expect(vf2.SecretKeyRef.Optional).NotTo(BeNil())
			Expect(*vf2.SecretKeyRef.Optional).To(BeTrue())

			// Validate top-level metrics, health, and leader election.
			Expect(cfg.Metrics.BindAddress).To(Equal("127.0.0.1:8080"))
			Expect(cfg.Health.HealthProbeBindAddress).To(Equal(":8081"))
			Expect(cfg.LeaderElection.LeaderElect).To(BeTrue())
			Expect(cfg.LeaderElection.ResourceName).To(Equal("0e41a1f4.securecodebox.io"))
		})
	})
})
