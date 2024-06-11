package main

import (
	"os"

	"github.com/secureCodeBox/secureCodeBox/scbctl/cmd"
	"github.com/spf13/cobra"
	"k8s.io/cli-runtime/pkg/genericclioptions"
)

var kubeconfigArgs = genericclioptions.NewConfigFlags(false)

var rootCmd = &cobra.Command{
	Use:   "scbctl",
	Short: "cli app to manage scans & other secureCodeBox resources",
	Long:  ``,
}

func init() {
	rootCmd.AddCommand(cmd.ScanCmd)
	rootCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")

	kubeconfigArgs.AddFlags(rootCmd.PersistentFlags())
}
func main() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}
