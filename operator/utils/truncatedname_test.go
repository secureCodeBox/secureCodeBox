// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package utils

import (
	"fmt"
	"testing"
)

type testData struct {
	in  string
	out string
}

func TestAbc(t *testing.T) {
	var tests = []testData{
		{
			in:  "abc",
			out: "abc-",
		},
		{
			in:  "scan-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			out: "scan-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-",
		},
		{
			in:  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			out: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-",
		},
		// Truncates strings ending in dots
		{
			in:  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.",
			out: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-",
		},
		// Also removes dots even when they are not the last char
		{
			in:  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.a",
			out: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-",
		},
	}

	for _, test := range tests {
		actual := TruncateName(test.in)
		if actual != test.out {
			t.Error(fmt.Errorf("TruncateName(\"%s\") returned \"%s\", expected \"%s\"", test.in, actual, test.out))
		}
	}
}
