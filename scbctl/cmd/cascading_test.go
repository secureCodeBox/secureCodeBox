// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	"bytes"
	"testing"

	"github.com/ddddddO/gtree"
	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"github.com/stretchr/testify/assert"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestBuildTree(t *testing.T) {
	tests := []struct {
		name     string
		scans    []v1.Scan
		expected string
	}{
		{
			name: "Single scan",
			scans: []v1.Scan{
				{
					ObjectMeta: metav1.ObjectMeta{
						Name: "scan1",
					},
				},
			},
			expected: `Scans
└── scan1
`,
		},
		{
			name: "Two unrelated scans",
			scans: []v1.Scan{
				{
					ObjectMeta: metav1.ObjectMeta{
						Name: "scan1",
					},
				},
				{
					ObjectMeta: metav1.ObjectMeta{
						Name: "scan2",
					},
				},
			},
			expected: `Scans
├── scan1
└── scan2
`,
		},
		{
			name: "One parent, one child",
			scans: []v1.Scan{
				{
					ObjectMeta: metav1.ObjectMeta{
						Name: "parent",
					},
				},
				{
					ObjectMeta: metav1.ObjectMeta{
						Name: "child",
						Annotations: map[string]string{
							ParentScanAnnotation: "parent",
						},
					},
				},
			},
			expected: `Scans
└── parent
    └── child
`,
		},
		{
			name: "Complex cascade",
			scans: []v1.Scan{
				{
					ObjectMeta: metav1.ObjectMeta{
						Name: "root",
					},
				},
				{
					ObjectMeta: metav1.ObjectMeta{
						Name: "child1",
						Annotations: map[string]string{
							ParentScanAnnotation: "root",
						},
					},
				},
				{
					ObjectMeta: metav1.ObjectMeta{
						Name: "child2",
						Annotations: map[string]string{
							ParentScanAnnotation: "root",
						},
					},
				},
				{
					ObjectMeta: metav1.ObjectMeta{
						Name: "grandchild",
						Annotations: map[string]string{
							ParentScanAnnotation: "child1",
						},
					},
				},
			},
			expected: `Scans
└── root
    ├── child1
    │   └── grandchild
    └── child2
`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			root := buildTree(tt.scans)
			var buf bytes.Buffer
			err := gtree.OutputProgrammably(&buf, root)
			assert.NoError(t, err)
			result := buf.String()
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestIsInitialScan(t *testing.T) {
	tests := []struct {
		name     string
		scan     v1.Scan
		expected bool
	}{
		{
			name: "Initial scan",
			scan: v1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Name: "initial",
				},
			},
			expected: true,
		},
		{
			name: "Child scan",
			scan: v1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Name: "child",
					Annotations: map[string]string{
						ParentScanAnnotation: "parent",
					},
				},
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isInitialScan(&tt.scan)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestIsCascadedFrom(t *testing.T) {
	tests := []struct {
		name       string
		childScan  v1.Scan
		parentScan v1.Scan
		expected   bool
	}{
		{
			name: "Direct child",
			childScan: v1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Name: "child",
					Annotations: map[string]string{
						ParentScanAnnotation: "parent",
					},
				},
			},
			parentScan: v1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Name: "parent",
				},
			},
			expected: true,
		},
		{
			name: "Unrelated scans",
			childScan: v1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Name: "scan1",
				},
			},
			parentScan: v1.Scan{
				ObjectMeta: metav1.ObjectMeta{
					Name: "scan2",
				},
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isCascadedFrom(&tt.childScan, &tt.parentScan)
			assert.Equal(t, tt.expected, result)
		})
	}
}
