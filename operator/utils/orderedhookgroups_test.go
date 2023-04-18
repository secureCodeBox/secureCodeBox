// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package utils

import (
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	corev1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

func createHook(name string, hookType executionv1.HookType, prio int) executionv1.ScanCompletionHook {
	return executionv1.ScanCompletionHook{
		ObjectMeta: corev1.ObjectMeta{
			Name:      name,
			Namespace: "default",
		},
		Spec: executionv1.ScanCompletionHookSpec{
			Type:     hookType,
			Priority: prio,
		},
	}
}

func createClusterHook(name string, hookType executionv1.HookType, prio int) executionv1.ClusterScanCompletionHook {
	return executionv1.ClusterScanCompletionHook{
		ObjectMeta: corev1.ObjectMeta{
			Name: name,
		},
		Spec: executionv1.ScanCompletionHookSpec{
			Type:     hookType,
			Priority: prio,
		},
	}
}

var _ = Describe("HookOrderingGroup Creation", func() {
	Context("HookOrderingGroup Creation / Sorting (Single Prio)", func() {
		It("Should always place ReadAndWrite Hooks into different Groups", func() {
			hooks := []executionv1.ScanCompletionHook{
				createHook("rw-1", executionv1.ReadAndWrite, 0),
				createHook("rw-2", executionv1.ReadAndWrite, 0),
			}

			orderedHookGroups := FromUnorderedList(MapHooksToHookStatus(hooks))

			Expect(orderedHookGroups).To(HaveLen(2), "Should create two groups")

			Expect(orderedHookGroups[0]).To(HaveLen(1), "groups should contain one entry")
			Expect(orderedHookGroups[1]).To(HaveLen(1), "groups should contain one entry")
		})

		It("Should behave the same with ClusterScanCompletionHooks", func() {
			hooks := []executionv1.ClusterScanCompletionHook{
				createClusterHook("rw-1", executionv1.ReadAndWrite, 0),
				createClusterHook("rw-2", executionv1.ReadAndWrite, 0),
			}

			orderedHookGroups := FromUnorderedList(MapClusterHooksToHookStatus(hooks))

			Expect(orderedHookGroups).To(HaveLen(2), "Should create two groups")

			Expect(orderedHookGroups[0]).To(HaveLen(1), "groups should contain one entry")
			Expect(orderedHookGroups[1]).To(HaveLen(1), "groups should contain one entry")
		})

		It("Should place place ReadOnly Hooks into the same groups", func() {
			hooks := []executionv1.ScanCompletionHook{
				createHook("ro-1", executionv1.ReadOnly, 0),
				createHook("ro-2", executionv1.ReadOnly, 0),
			}

			orderedHookGroups := FromUnorderedList(MapHooksToHookStatus(hooks))

			Expect(orderedHookGroups).To(HaveLen(1))
			Expect(orderedHookGroups[0]).To(HaveLen(2))
		})

		It("Should handle mixed hook types", func() {
			hooks := []executionv1.ScanCompletionHook{
				createHook("rw-1", executionv1.ReadAndWrite, 0),
				createHook("ro-1", executionv1.ReadOnly, 0),
				createHook("rw-2", executionv1.ReadAndWrite, 0),
				createHook("ro-2", executionv1.ReadOnly, 0),
			}

			orderedHookGroups := FromUnorderedList(MapHooksToHookStatus(hooks))

			Expect(len(orderedHookGroups)).To(Equal(3))

			Expect(len(orderedHookGroups[0])).To(Equal(1))
			Expect(len(orderedHookGroups[1])).To(Equal(1))
			Expect(len(orderedHookGroups[2])).To(Equal(2))
		})
	})

	Context("HookOrderingGroup Creation / Sorting (Different Priorities)", func() {
		It("Should always place ReadAndWrite Hooks into different Groups", func() {
			hooks := []executionv1.ScanCompletionHook{
				createHook("rw-1", executionv1.ReadAndWrite, 0),
				createHook("rw-2", executionv1.ReadAndWrite, 1),
			}

			orderedHookGroups := FromUnorderedList(MapHooksToHookStatus(hooks))

			Expect(orderedHookGroups).To(HaveLen(2), "Should create two groups")

			Expect(orderedHookGroups).To(Equal([][]*executionv1.HookStatus{
				{
					{HookName: "rw-2", State: "Pending", JobName: "", Priority: 1, Type: "ReadAndWrite"},
				},
				{
					{HookName: "rw-1", State: "Pending", JobName: "", Priority: 0, Type: "ReadAndWrite"},
				},
			}))
		})

		It("Should order ro hooks properly when they have different priorities", func() {
			hooks := []executionv1.ScanCompletionHook{
				createHook("ro-1", executionv1.ReadOnly, 4),
				createHook("ro-2", executionv1.ReadOnly, 2),
				createHook("ro-3", executionv1.ReadOnly, 3),
				createHook("ro-4", executionv1.ReadOnly, 1),
			}

			orderedHookGroups := FromUnorderedList(MapHooksToHookStatus(hooks))

			Expect(orderedHookGroups).To(Equal([][]*executionv1.HookStatus{
				{
					{HookName: "ro-1", State: "Pending", JobName: "", Priority: 4, Type: "ReadOnly"},
				},
				{
					{HookName: "ro-3", State: "Pending", JobName: "", Priority: 3, Type: "ReadOnly"},
				},
				{
					{HookName: "ro-2", State: "Pending", JobName: "", Priority: 2, Type: "ReadOnly"},
				},
				{
					{HookName: "ro-4", State: "Pending", JobName: "", Priority: 1, Type: "ReadOnly"},
				},
			}))
		})

		It("Should order a mix of ro & rw hooks properly when they have different priorities", func() {
			hooks := []executionv1.ScanCompletionHook{
				createHook("ro-1", executionv1.ReadOnly, 4),
				createHook("ro-2", executionv1.ReadOnly, 4),
				createHook("rw-1", executionv1.ReadAndWrite, 4),
				createHook("rw-2", executionv1.ReadAndWrite, 4),
				createHook("ro-3", executionv1.ReadOnly, 2),
				createHook("rw-3", executionv1.ReadAndWrite, 2),
				createHook("ro-4", executionv1.ReadOnly, 3),
				createHook("ro-5", executionv1.ReadOnly, 1),
			}

			orderedHookGroups := FromUnorderedList(MapHooksToHookStatus(hooks))

			Expect(orderedHookGroups).To(Equal([][]*executionv1.HookStatus{
				{
					{HookName: "rw-1", State: "Pending", JobName: "", Priority: 4, Type: "ReadAndWrite"},
				},
				{
					{HookName: "rw-2", State: "Pending", JobName: "", Priority: 4, Type: "ReadAndWrite"},
				},
				{
					{HookName: "ro-1", State: "Pending", JobName: "", Priority: 4, Type: "ReadOnly"},
					{HookName: "ro-2", State: "Pending", JobName: "", Priority: 4, Type: "ReadOnly"},
				},
				{
					{HookName: "ro-4", State: "Pending", JobName: "", Priority: 3, Type: "ReadOnly"},
				},
				{
					{HookName: "rw-3", State: "Pending", JobName: "", Priority: 2, Type: "ReadAndWrite"},
				},
				{
					{HookName: "ro-3", State: "Pending", JobName: "", Priority: 2, Type: "ReadOnly"},
				},
				{
					{HookName: "ro-5", State: "Pending", JobName: "", Priority: 1, Type: "ReadOnly"},
				},
			}))
		})
	})
})

var _ = Describe("HookOrderingGroup Retrival", func() {
	Context("Current() should return the group of hooks which should be executed at the moment", func() {
		It("Should return the first if all hooks are pending", func() {
			err, currentHookGroup := CurrentHookGroup([][]*executionv1.HookStatus{
				{
					{HookName: "rw-1", State: "Pending", JobName: "", Priority: 4, Type: "ReadAndWrite"},
				},
				{
					{HookName: "ro-1", State: "Pending", JobName: "", Priority: 4, Type: "ReadOnly"},
					{HookName: "ro-2", State: "Pending", JobName: "", Priority: 4, Type: "ReadOnly"},
				},
			})

			Expect(err).To(BeNil())
			Expect(currentHookGroup).To(Equal(
				[]*executionv1.HookStatus{
					{HookName: "rw-1", State: "Pending", JobName: "", Priority: 4, Type: "ReadAndWrite"},
				},
			))
		})

		It("Should return the first group if it consists of hooks currently in progress", func() {
			err, currentHookGroup := CurrentHookGroup([][]*executionv1.HookStatus{
				{
					{HookName: "rw-1", State: "InProgress", JobName: "", Priority: 4, Type: "ReadAndWrite"},
				},
				{
					{HookName: "ro-1", State: "Pending", JobName: "", Priority: 4, Type: "ReadOnly"},
					{HookName: "ro-2", State: "Pending", JobName: "", Priority: 4, Type: "ReadOnly"},
				},
			})

			Expect(err).To(BeNil())
			Expect(currentHookGroup).To(Equal(
				[]*executionv1.HookStatus{
					{HookName: "rw-1", State: "InProgress", JobName: "", Priority: 4, Type: "ReadAndWrite"},
				},
			))
		})

		It("Should return the second group if the first group is completed", func() {
			err, currentHookGroup := CurrentHookGroup([][]*executionv1.HookStatus{
				{
					{HookName: "rw-1", State: "Completed", JobName: "", Priority: 4, Type: "ReadAndWrite"},
				},
				{
					{HookName: "ro-1", State: "Pending", JobName: "", Priority: 4, Type: "ReadOnly"},
					{HookName: "ro-2", State: "Pending", JobName: "", Priority: 4, Type: "ReadOnly"},
				},
			})

			Expect(err).To(BeNil())
			Expect(currentHookGroup).To(Equal(
				[]*executionv1.HookStatus{
					{HookName: "ro-1", State: "Pending", JobName: "", Priority: 4, Type: "ReadOnly"},
					{HookName: "ro-2", State: "Pending", JobName: "", Priority: 4, Type: "ReadOnly"},
				},
			))
		})

		It("Should return nil if the first group failed", func() {
			err, currentHookGroup := CurrentHookGroup([][]*executionv1.HookStatus{
				{
					{HookName: "rw-1", State: "Failed", JobName: "", Priority: 4, Type: "ReadAndWrite"},
				},
				{
					{HookName: "ro-1", State: "Pending", JobName: "", Priority: 4, Type: "ReadOnly"},
					{HookName: "ro-2", State: "Pending", JobName: "", Priority: 4, Type: "ReadOnly"},
				},
			})

			Expect(err).To(MatchError("Hook rw-1 failed to be executed."))
			Expect(currentHookGroup).To(BeNil())
		})

		It("Should return nil if no hooks are configured", func() {
			err, currentHookGroup := CurrentHookGroup([][]*executionv1.HookStatus{})

			Expect(err).To(BeNil())
			Expect(currentHookGroup).To(BeNil())
		})
	})
})
