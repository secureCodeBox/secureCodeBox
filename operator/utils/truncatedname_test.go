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
	}

	for _, test := range tests {
		actual := TruncateName(test.in)
		if actual != test.out {
			t.Error(fmt.Errorf("TruncateName(\"%s\") returned \"%s\", expected \"%s\"", test.in, actual, test.out))
		}
	}
}
