// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package main

import (
	"os"

	"github.com/secureCodeBox/secureCodeBox/scbctl/cmd"
)

func main() {
	rootCmd := cmd.NewRootCommand()
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}
