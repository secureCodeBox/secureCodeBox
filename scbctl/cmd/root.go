// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	kubernetes "github.com/secureCodeBox/secureCodeBox/scbctl/pkg"
	"github.com/spf13/cobra"
	"k8s.io/cli-runtime/pkg/genericclioptions"
)

var kubeconfigArgs = genericclioptions.NewConfigFlags(false)

var (
	clientProvider kubernetes.ClientProvider = &kubernetes.DefaultClientProvider{}
)

func NewRootCommand() *cobra.Command {
	rootCmd := &cobra.Command{
		Use:   "scbctl",
		Short: "cli app to manage scans & other secureCodeBox resources",
		Long:  ``,
	}
	kubeconfigArgs.AddFlags(rootCmd.PersistentFlags())

	rootCmd.AddCommand(NewScanCommand())
	rootCmd.AddCommand(NewTriggerCommand())
	rootCmd.AddCommand(NewCascadeCommand())

	return rootCmd
}
