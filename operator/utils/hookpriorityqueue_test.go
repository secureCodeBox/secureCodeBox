package utils

import (
	"container/heap"
	"fmt"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"testing"
)

func TestQueuePriority(t *testing.T) {
	var items = []*executionv1.HookStatus{
		{
			HookName: "banana",
			Priority: 3,
			State:    executionv1.Pending,
		},
		{
			HookName: "apple",
			Priority: 2,
			State:    executionv1.InProgress,
		},
		{
			HookName: "pear",
			Priority: 4,
			State:    executionv1.Failed,
		},
		{
			HookName: "kiwi",
			Priority: 4,
			State:    executionv1.Completed,
		},
	}

	pq := PriorityQueueFromSlice(&items, hookIsNotCompleted)

	// Take the items out; they should arrive in decreasing priority order.
	assertTopEqual(t, &pq, items[2])
	assertTopEqual(t, &pq, items[0])
	assertTopEqual(t, &pq, items[1])
}

func TestQueuePool(t *testing.T) {
	var hookStatuses = []*executionv1.HookStatus{
		{
			HookName: "banana",
			State:    executionv1.InProgress,
			Type:     executionv1.ReadOnly,
			Priority: 1,
		},
		{
			HookName: "apple",
			State:    executionv1.InProgress,
			Type:     executionv1.ReadAndWrite,
			Priority: 1,
		},
		{
			HookName: "pear",
			State:    executionv1.Pending,
			Type:     executionv1.ReadAndWrite,
			Priority: 1,
		},
	}

	pq := PriorityQueueFromSlice(&hookStatuses, hookIsNotCompleted)

	// Take the items out; they should arrive in decreasing priority order.
	assertTopEqual(t, &pq, hookStatuses[1])
	assertTopEqual(t, &pq, hookStatuses[2])
	assertTopEqual(t, &pq, hookStatuses[0])
}

func hookIsNotCompleted(hook *executionv1.HookStatus) bool {
	return hook.State != executionv1.Completed
}

func assertTopEqual(t *testing.T, queue *PriorityQueue, expected *executionv1.HookStatus) {
	assertEqual(t, queue.Peek().(*PriorityQueueItem).Value, expected)
	assertEqual(t, heap.Pop(queue).(*PriorityQueueItem).Value, expected)
}

func assertEqual(t *testing.T, received *executionv1.HookStatus, expected *executionv1.HookStatus) {
	if received != expected {
		t.Fatal(
			fmt.Errorf("received '%s' '%s' priority '%d' hook '%s' expecting '%s' '%s' priority '%d' hook '%s'",
				received.State, received.Type, received.Priority, received.HookName,
				expected.State, expected.Type, received.Priority, expected.HookName,
			),
		)
	}
}
