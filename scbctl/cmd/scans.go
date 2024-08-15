// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	"fmt"
	"strings"

	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/spf13/cobra"
	metav2 "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func NewScanCommand() *cobra.Command {
	scanCmd := &cobra.Command{
		Use:   "scan [scanType] -- [parameters...]",
		Short: "Create a new scan",
		Long:  `Create a new Scan custom resource in the the current namespace`,
		Args:  cobra.MinimumNArgs(1),
		Example: `
		# Create a new scan
		scbctl scan nmap -- scanme.nmap.org

		# Create a scan with a custom name
		scbctl scan nmap --name scanme-nmap-org -- scanme.nmap.org

		# Create a with a different scan type
		scbctl scan nuclei -- -target example.com

		# Create in a different namespace
		scbctl scan --namespace foobar nmap -- -p 80 scanme.nmap.org
		`,
		SilenceUsage: true,
		RunE: func(cmd *cobra.Command, args []string) error {
			scanType := args[0]

			scanName := scanType
			if name, err := cmd.Flags().GetString("name"); err == nil && name != "" {
				scanName = name
			}
			paramIndex := cmd.ArgsLenAtDash()
			if paramIndex == -1 {
				return fmt.Errorf("you must use '--' to separate scan parameters")
			}

			parameters := args[paramIndex:]

			kubeclient, namespace, err := clientProvider.GetClient(kubeconfigArgs)
			if err != nil {
				return fmt.Errorf("error initializing kubernetes client. your kubeconfig is likely malformed or invalid. %s", err)
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
					ScanType:   scanType,
					Parameters: parameters,
				},
			}

			err = kubeclient.Create(cmd.Context(), scan)
			if err != nil {
				if metav2.IsNotFound(err) {
					return fmt.Errorf("failed to create Scan: namespace '%s' not found", namespace)
				}
				return fmt.Errorf("failed to create scan: %s", err)
			}

			fmt.Printf("🚀 Successfully created a new Scan '%s'\n", scanName)
			return nil
		},
		ValidArgsFunction: func(cmd *cobra.Command, args []string, toComplete string) ([]string, cobra.ShellCompDirective) {
			if len(args) != 0 {
				return nil, cobra.ShellCompDirectiveNoFileComp
			}

			kubeclient, namespace, err := clientProvider.GetClient(kubeconfigArgs)
			if err != nil {
				return nil, cobra.ShellCompDirectiveError
			}

			if namespaceFlag, err := cmd.Flags().GetString("namespace"); err == nil && namespaceFlag != "" {
				namespace = namespaceFlag
			}

			var scanTypeList v1.ScanTypeList
			err = kubeclient.List(cmd.Context(), &scanTypeList, client.InNamespace(namespace))
			if err != nil {
				return nil, cobra.ShellCompDirectiveError
			}

			scanTypes := make([]string, len(scanTypeList.Items))
			for i, scanType := range scanTypeList.Items {
				scanTypes[i] = scanType.Name
			}

			return scanTypes, cobra.ShellCompDirectiveNoFileComp
		},
	}

	scanCmd.Flags().String("name", "", "Name of the created scan. If no name is provided, the ScanType will be used as the name")

	return scanCmd
}
