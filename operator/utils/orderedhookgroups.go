// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package utils

import (
	"fmt"
	"sort"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
)

func CurrentHookGroup(orderedHookGroup [][]*executionv1.HookStatus) (error, []*executionv1.HookStatus) {
	for _, group := range orderedHookGroup {
		for _, hookStatus := range group {
			switch hookStatus.State {
			case executionv1.Pending:
				return nil, group
			case executionv1.InProgress:
				return nil, group
			case executionv1.Failed:
				return fmt.Errorf("Hook %s failed to be executed.", hookStatus.HookName), nil
			case executionv1.Cancelled:
				return fmt.Errorf("Hook %s was cancelled while it was executed.", hookStatus.HookName), nil
			case executionv1.Completed:
				// continue to next group
			}
		}
	}

	return nil, nil
}

func FromUnorderedList(hookStatuses []*executionv1.HookStatus) [][]*executionv1.HookStatus {
	// Group hookStatuses into a map by their prio class
	hooksByPrioClass := map[int][]*executionv1.HookStatus{}
	// keep a list of existing classes
	prioClasses := []int{}
	for _, hookStatus := range hookStatuses {
		prio := hookStatus.Priority

		if _, ok := hooksByPrioClass[prio]; ok {
			hooksByPrioClass[prio] = append(hooksByPrioClass[prio], hookStatus)
		} else {
			hooksByPrioClass[prio] = []*executionv1.HookStatus{hookStatus}
			prioClasses = append(prioClasses, prio)
		}
	}

	// sort prio classes in decending order
	sort.Slice(prioClasses, func(i, j int) bool {
		return prioClasses[i] > prioClasses[j]
	})

	groups := [][]*executionv1.HookStatus{}
	for _, prioClass := range prioClasses {
		groups = append(groups, OrderHookStatusesInsideAPrioClass(hooksByPrioClass[prioClass])...)
	}

	return groups
}

func MapHooksToHookStatus(hooks []executionv1.ScanCompletionHook) []*executionv1.HookStatus {
	hookStatuses := []*executionv1.HookStatus{}

	for _, hook := range hooks {
		hookStatuses = append(hookStatuses, &executionv1.HookStatus{
			HookName: hook.Name,
			State:    executionv1.Pending,
			Priority: hook.Spec.Priority,
			Type:     hook.Spec.Type,
		})
	}

	return hookStatuses
}

func MapClusterHooksToHookStatus(hooks []executionv1.ClusterScanCompletionHook) []*executionv1.HookStatus {
	hookStatuses := []*executionv1.HookStatus{}

	for _, hook := range hooks {
		hookStatuses = append(hookStatuses, &executionv1.HookStatus{
			HookName: hook.Name,
			State:    executionv1.Pending,
			Priority: hook.Spec.Priority,
			Type:     hook.Spec.Type,
		})
	}

	return hookStatuses
}

func OrderHookStatusesInsideAPrioClass(hookStatuses []*executionv1.HookStatus) [][]*executionv1.HookStatus {
	groups := [][]*executionv1.HookStatus{}
	readOnlyGroups := []*executionv1.HookStatus{}
	for _, hookStatus := range hookStatuses {
		switch hookStatus.Type {
		case executionv1.ReadAndWrite:
			groups = append(groups, []*executionv1.HookStatus{
				hookStatus,
			})
		case executionv1.ReadOnly:
			readOnlyGroups = append(readOnlyGroups, hookStatus)
		}
	}

	// Append the ReadOnly Hook Group at the end if existent
	if len(readOnlyGroups) != 0 {
		groups = append(groups, readOnlyGroups)
	}

	return groups
}
