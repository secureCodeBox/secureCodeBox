package main

import (
	"os"

	"github.com/secureCodeBox/secureCodeBox/scbctl/cmd"
	"github.com/spf13/cobra"
	v1 "k8s.io/api/apps/v1"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/cli-runtime/pkg/genericclioptions"
)

var kubeconfigArgs = genericclioptions.NewConfigFlags(false)
var scheme = runtime.NewScheme()

var rootCmd = &cobra.Command{
	Use:   "scbctl",
	Short: "cli app to manage scans & other secureCodeBox resources",
	Long:  ``,
}

func init() {
	utilruntime.Must(v1.AddToScheme(scheme))
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
