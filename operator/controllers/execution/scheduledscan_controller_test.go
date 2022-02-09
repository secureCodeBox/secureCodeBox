// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package controllers

import (
	"fmt"
	"testing"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type testData struct {
	in                   map[string]string
	expectedMapKeyLength int
}

// Tests that getAnnotationsForScan drops all annotations not prefixed with "*.securecodebox.io/*"
func TestGetAnnotationsForScan(t *testing.T) {
	tests := []testData{
		{
			in: map[string]string{
				"foobar": "bar",
			},
			expectedMapKeyLength: 0,
		},
		{
			in: map[string]string{
				"foobar.securecodebox.io/bar": "bar",
			},
			expectedMapKeyLength: 1,
		},
		{
			in: map[string]string{
				"barfoo.securecodebox.io/bar": "bar",
				"foo":                         "bar",
			},
			expectedMapKeyLength: 1,
		},
		{
			in: map[string]string{
				"barfoo.securecodebox.io/bar": "bar",
				"barfoo.securecodebox.io/foo": "bar",
			},
			expectedMapKeyLength: 2,
		},
	}

	for _, test := range tests {
		scheduledScan := executionv1.ScheduledScan{
			ObjectMeta: metav1.ObjectMeta{
				Name:        "foobar",
				Annotations: test.in,
			},
		}
		actual := getAnnotationsForScan(scheduledScan)
		if len(actual) != test.expectedMapKeyLength {
			t.Error(fmt.Errorf("getAnnotationsForScan should only copy over annotations following the pattern '*.securecodebox.io', but map: %v returned a map with %d keys (%d expected)", test.in, len(actual), test.expectedMapKeyLength))
		}
	}
}
