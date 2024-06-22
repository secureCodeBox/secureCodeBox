// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package main

import (
	"os"

	"github.com/secureCodeBox/secureCodeBox/scbctl/cmd"
	v1 "k8s.io/api/apps/v1"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
)

var scheme = runtime.NewScheme()

func init() {
	utilruntime.Must(v1.AddToScheme(scheme))
}

func main() {
	rootCmd := cmd.NewRootCommand()
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}
