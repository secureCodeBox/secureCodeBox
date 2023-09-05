// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package utils

import (
	"fmt"
	"reflect"
	"testing"
)

type testDataMaps struct {
	inOne map[string]string
	inTwo map[string]string
	out   map[string]string
}

func TestStringMapsMerge(t *testing.T) {
	var tests = []testDataMaps{
		{
			inOne: map[string]string{"foo": "1", "bar": "2"},
			inTwo: map[string]string{"x": "3", "y": "4"},
			out:   map[string]string{"foo": "1", "bar": "2", "x": "3", "y": "4"},
		},
	}

	for _, test := range tests {
		actual := MergeStringMaps(test.inOne, test.inTwo)
		if !reflect.DeepEqual(actual, test.out) {
			t.Error(fmt.Errorf("mergeStringMaps(\"%s\", \"%s\") returned \"%s\", expected \"%s\"", test.inOne, test.inTwo, actual, test.out))
		}
	}
}
