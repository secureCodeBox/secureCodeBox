package utils

import (
	"container/heap"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
)

// Taken (mostly) from official example https://pkg.go.dev/container/heap

// An PriorityQueueItem is something we manage in a priority queue.
type PriorityQueueItem struct {
	Value    *executionv1.HookStatus
	Priority int // The Priority of the item in the queue.
	Index    int // The Index of the item in the heap.
}

// A PriorityQueue implements heap.Interface and holds Items.
type PriorityQueue []*PriorityQueueItem

func (pq PriorityQueue) Len() int { return len(pq) }

func (pq PriorityQueue) Less(i, j int) bool {
	// We want Pop to give us the highest, not lowest, priority so we invert result

	if pq[i].Priority == pq[j].Priority {
		if pq[i].Value.Type == pq[j].Value.Type {
			// Prefer hook if it is in progress
			return pq[i].Value.State == executionv1.InProgress
		} else {
			// Prefer ReadAndWriteHooks
			return pq[i].Value.Type == executionv1.ReadAndWrite
		}
	} else {
		return pq[i].Priority > pq[j].Priority
	}
}

func (pq PriorityQueue) Swap(i, j int) {
	pq[i], pq[j] = pq[j], pq[i]
	pq[i].Index = i
	pq[j].Index = j
}

func (pq *PriorityQueue) Push(x interface{}) {
	n := len(*pq)
	item := x.(*PriorityQueueItem)
	item.Index = n
	*pq = append(*pq, item)
}

func (pq *PriorityQueue) Pop() interface{} {
	old := *pq
	n := len(old)
	item := old[n-1]
	old[n-1] = nil  // avoid memory leak
	item.Index = -1 // for safety
	*pq = old[0 : n-1]
	return item
}

func (pq *PriorityQueue) Peek() interface{} {
	return (*pq)[0]
}

func PriorityQueueFromSlice(hooks *[]*executionv1.HookStatus, conditional func(hook *executionv1.HookStatus) bool) PriorityQueue {
	var priorityQueue = make(PriorityQueue, len(*hooks))
	var completedHooks = 0
	for _, hook := range *hooks {
		if conditional(hook) {
			priorityQueueItem := PriorityQueueItem{
				Value:    hook,
				Priority: hook.Priority,
			}
			priorityQueue[completedHooks] = &priorityQueueItem
			completedHooks++
		}
	}
	priorityQueue = priorityQueue[:completedHooks]
	heap.Init(&priorityQueue)
	return priorityQueue
}
