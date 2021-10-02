package utils

import (
	"container/heap"
	"fmt"
	"testing"
)

var items = []PriorityQueueItem{
	{
		Value:    "banana",
		Priority: 3,
	},
	{
		Value:    "apple",
		Priority: 2,
	},
	{
		Value:    "pear",
		Priority: 4,
	},
}

func TestQueue(t *testing.T) {
	pq := make(PriorityQueue, len(items) + 5) // Test overallocation
	for i, _ := range items {
		pq[i] = &items[i]
	}
	pq = pq[:len(items)]
	heap.Init(&pq)

	// Take the items out; they should arrive in decreasing priority order.
	var item1peek = pq.Peek()
	var item1 = heap.Pop(&pq).(*PriorityQueueItem)
	if item1peek != item1 {
		t.Error(fmt.Errorf("peek didn't equal pop"))
	}
	if item1.Value != items[2].Value {
		t.Error(fmt.Errorf("received %s with priority %d expecting %s with priority %d", item1.Value, item1.Priority, items[2].Value, items[2].Priority))
	}

	var item2peek = pq.Peek()
	var item2 = heap.Pop(&pq).(*PriorityQueueItem)
	if item2peek != item2 {
		t.Error(fmt.Errorf("peek didn't equal pop"))
	}
	if item2.Value != items[0].Value {
		t.Error(fmt.Errorf("received %s with priority %d expecting %s with priority %d", item2.Value, item2.Priority, items[0].Value, items[0].Priority))
	}

	var item3peek = pq.Peek()
	var item3 = heap.Pop(&pq).(*PriorityQueueItem)
	if item3peek != item3 {
		t.Error(fmt.Errorf("peek didn't equal pop"))
	}
	if item3.Value != items[1].Value {
		t.Error(fmt.Errorf("received %s with priority %d expecting %s with priority %d", item3.Value, item3.Priority, items[1].Value, items[1].Priority))
	}
}
