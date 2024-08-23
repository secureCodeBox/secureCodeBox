// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	"fmt"

	"github.com/ddddddO/gtree"
	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"github.com/spf13/cobra"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type cascadeOptions struct {
	configFlags *genericclioptions.ConfigFlags
	genericclioptions.IOStreams

	namespace string
}

func NewCascadeCommand() *cobra.Command {
	cascadeCmd := &cobra.Command{
		Use:   "cascade",
		Short: "Visualize cascading scans",
		Long:  `Visualize the relationships between scans based on their cascading relationships`,
		RunE: func(cmd *cobra.Command, args []string) error {
			kubeclient, namespace, err := clientProvider.GetClient(kubeconfigArgs)
			if err != nil {
				return fmt.Errorf("error initializing kubernetes client: %w", err)
			}

			if namespaceFlag, err := cmd.Flags().GetString("namespace"); err == nil && namespaceFlag != "" {
				namespace = namespaceFlag
			}

			var scans v1.ScanList
			if err := kubeclient.List(cmd.Context(), &scans, client.InNamespace(namespace)); err != nil {
				return fmt.Errorf("error listing Scans: %w", err)
			}

			root := buildTree(scans.Items)

			return gtree.OutputProgrammably(cmd.OutOrStdout(), root)
		},
	}

	return cascadeCmd
}

const (
	ParentScanAnnotation = "cascading.securecodebox.io/parent-scan"
)

func buildTree(scans []v1.Scan) *gtree.Node {
	root := gtree.NewRoot("Scans")

	scanMap := make(map[string]*v1.Scan)
	for i := range scans {
		scanMap[scans[i].Name] = &scans[i]
	}
	for _, scan := range scans {
		scanMap[scan.Name] = &scan
	}

	for _, scan := range scans {
		if isInitialScan(&scan) {
			scanNode := root.Add(scan.Name)
			buildScanSubtree(scanNode, &scan, scanMap)
		}
	}

	return root
}

func isInitialScan(scan *v1.Scan) bool {
	return scan.Annotations[ParentScanAnnotation] == ""
}

func buildScanSubtree(node *gtree.Node, scan *v1.Scan, scanMap map[string]*v1.Scan) {
	for _, childScan := range scanMap {
		if isCascadedFrom(childScan, scan) {
			childNode := node.Add(childScan.Name)
			buildScanSubtree(childNode, childScan, scanMap)
		}
	}
}

func isCascadedFrom(childScan *v1.Scan, parentScan *v1.Scan) bool {
	return childScan.Annotations[ParentScanAnnotation] == parentScan.Name
}
