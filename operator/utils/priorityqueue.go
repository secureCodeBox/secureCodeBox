package utils

import (
	"container/heap"
)

// Taken (mostly) from official example https://pkg.go.dev/container/heap

// An PriorityQueueItem is something we manage in a priority queue.
type PriorityQueueItem struct {
	Value    interface{}
	Priority int // The Priority of the item in the queue.
	Index    int // The Index of the item in the heap.
}

// A PriorityQueue implements heap.Interface and holds Items.
type PriorityQueue []*PriorityQueueItem

func (pq PriorityQueue) Len() int { return len(pq) }

func (pq PriorityQueue) Less(i, j int) bool {
	// We want Pop to give us the highest, not lowest, priority so we use greater than here.
	return pq[i].Priority > pq[j].Priority
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

func (pq *PriorityQueue) Peek() interface{} {
	return (*pq)[0]
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

// update modifies the priority and Value of an PriorityQueueItem in the queue.
func (pq *PriorityQueue) update(item *PriorityQueueItem, value interface{}, priority int) {
	item.Value = value
	item.Priority = priority
	heap.Fix(pq, item.Index)
}
