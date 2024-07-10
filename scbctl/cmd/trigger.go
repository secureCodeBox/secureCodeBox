package cmd

import (
	"context"
	"fmt"

	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"github.com/secureCodeBox/secureCodeBox/operator/utils"

	"github.com/spf13/cobra"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
)


func NewTriggerCommand() *cobra.Command {
	triggerCmd := &cobra.Command{
		Use: "trigger [filename]",
		Short: "Trigger a new scheduled scan",
		Long: `Trigger a new scan custom ressource in the current namespace`,
		Example: ``,
		SilenceUsage: true,

		RunE:  func(cmd *cobra.Command, args []string) error {
			scheduledScanName := args[0]
			kubeclient, namespace, err := clientProvider.GetClient(kubeconfigArgs)
			if err != nil {
				return fmt.Errorf("error initializing kubernetes clinet, your kubeconfig is likely malformed or invalid ")
			}

			if namespaceFlag, err := cmd.Flags().GetString("namespace"); err == nil && namespaceFlag != "" {
				namespace = namespaceFlag
			}

			var scan v1.ScheduledScan

			err = kubeclient.Get(context.TODO(), types.NamespacedName{Name: scheduledScanName, Namespace: namespace}, &scan)
			if err != nil {
				if apierrors.IsNotFound(err) {
					return fmt.Errorf("could not find ScheduledScan '%s' in namespace '%s'\n", scheduledScanName, namespace)
				} else {
					panic(err)
				}
			}

			utils.RetriggerScheduledScan(context.TODO(), kubeclient.Status(), scan)
			fmt.Printf("triggered new Scan for ScheduledScan '%s'\n", scheduledScanName)
		

			return nil
		},
	}

	return triggerCmd
}
