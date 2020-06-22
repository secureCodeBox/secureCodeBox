package utils

import "fmt"

// TruncateName Ensures that the name used for a kubernetes object doesn't exceed the 63 char length limit. This actually cuts of anything after char 57, so that we can use the randomly generated suffix from k8s `generateName`.
func TruncateName(name string) string {
	if len(name) >= 57 {
		return fmt.Sprintf("%s-", name[0:57])
	}
	return fmt.Sprintf("%s-", name)
}
