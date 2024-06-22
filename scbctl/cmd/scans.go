// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	"context"
	"fmt"
	"strings"

	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"

	"github.com/spf13/cobra"
	metav2 "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func NewScanCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "scan [scanType] -- [parameters...]",
		Short: "Create a new scan",
		Long:  `Create a new Scan custom resource in the the current namespace`,
		Args:  cobra.MinimumNArgs(1),
		Example: `
		# Create a new scan
		scbctl scan nmap -- scanme.nmap.org
		# Create in a different namespace
		scbctl scan --namespace foobar nmap -- -p 80 scanme.nmap.org
		`,
		SilenceUsage: true,
		RunE: func(cmd *cobra.Command, args []string) error {

			scanName := args[0]
			paramIndex := cmd.ArgsLenAtDash()
			if paramIndex == -1 {
				return fmt.Errorf("you must use '--' to separate scan parameters")
			}

			parameters := args[paramIndex:]

			fmt.Println("🎬 Initializing Kubernetes client")

			kubeclient, namespace, err := clientProvider.GetClient(kubeconfigArgs)
			if err != nil {
				return fmt.Errorf("error initializing kubernetes client: %s", err)
			}

			if namespaceFlag, err := cmd.Flags().GetString("namespace"); err == nil && namespaceFlag != "" {
				namespace = namespaceFlag
			}

			fmt.Printf("🆕 Creating a new scan with name '%s' and parameters '%s'\n", scanName, strings.Join(parameters, " "))

			scan := &v1.Scan{
				TypeMeta: metav1.TypeMeta{
					Kind:       "Scan",
					APIVersion: "execution.securecodebox.io/v1",
				},
				ObjectMeta: metav1.ObjectMeta{
					Name:      scanName,
					Namespace: namespace,
				},
				Spec: v1.ScanSpec{
					ScanType:   scanName,
					Parameters: parameters,
				},
			}

			fmt.Println("🔁 Launching the scan")

			err = kubeclient.Create(context.TODO(), scan)
			if err != nil {
				if metav2.IsNotFound(err) {
					return fmt.Errorf("failed to create Scan: namespace '%s' not found", namespace)
				}
				return fmt.Errorf("failed to create scan: %s", err)
			}

			fmt.Printf("🚀 Successfully created a new Scan '%s'\n", args[0])
			return nil
		},
	}
}
