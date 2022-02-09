// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package utils

import (
	"fmt"
	"strings"
)

// TruncateName Ensures that the name used for a kubernetes object doesn't exceed the 63 char length limit. This actually cuts of anything after char 57, so that we can use the randomly generated suffix from k8s `generateName`.
func TruncateName(name string) string {
	if len(name) >= 57 {
		name = name[0:57]
	}

	// Ensure that the string does not end in a dot.
	// This would not be a valid domain name thous rejected by kubernetes
	if strings.HasSuffix(name, ".") {
		name = name[0:(len(name) - 1)]
	}

	return fmt.Sprintf("%s-", name)
}
