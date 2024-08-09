// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	"fmt"
	"os"

	"github.com/ddddddO/gtree"
	cascadingv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/cascading/v1"
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

// var scheme = runtime.NewScheme()

// func init() {
//     utilruntime.Must(cascadingv1.AddToScheme(scheme))
//     utilruntime.Must(v1.AddToScheme(scheme))
// }

func NewCascadeCommand() *cobra.Command {
	cascadeCmd := &cobra.Command{
			Use:   "cascade",
			Short: "Visualize cascading rules and scans",
			Long:  `Visualize the relationships between scans, their findings, and the cascading rules they trigger`,
			RunE: func(cmd *cobra.Command, args []string) error {
					kubeclient, namespace, err := clientProvider.GetClient(kubeconfigArgs)
					if err != nil {
							return fmt.Errorf("error initializing kubernetes client: %w", err)
					}

					if namespaceFlag, err := cmd.Flags().GetString("namespace"); err == nil && namespaceFlag != "" {
							namespace = namespaceFlag
					}

					var rules cascadingv1.CascadingRuleList
					if err := kubeclient.List(cmd.Context(), &rules, client.InNamespace(namespace)); err != nil {
							return fmt.Errorf("error listing CascadingRules: %w", err)
					}

					var scans v1.ScanList
					if err := kubeclient.List(cmd.Context(), &scans, client.InNamespace(namespace)); err != nil {
							return fmt.Errorf("error listing Scans: %w", err)
					}

					root := buildTree(scans.Items, rules.Items)

					if err := gtree.OutputProgrammably(os.Stdout, root); err != nil {
							return fmt.Errorf("error outputting tree: %w", err)
					}

					return nil
			},
	}

	return cascadeCmd
}

func buildTree(scans []v1.Scan, rules []cascadingv1.CascadingRule) *gtree.Node {
	root := gtree.NewRoot("Scans")
	
	scanMap := make(map[string]*v1.Scan)
	for i := range scans {
			scanMap[scans[i].Name] = &scans[i]
	}

	for _, scan := range scans {
			if isInitialScan(&scan) {
					scanNode := root.Add(scan.Name)
					buildScanSubtree(scanNode, &scan, scanMap, rules)
			}
	}

	return root
}

func isInitialScan(scan *v1.Scan) bool {
	return scan.Spec.Cascades != nil
}

func buildScanSubtree(node *gtree.Node, scan *v1.Scan, scanMap map[string]*v1.Scan, rules []cascadingv1.CascadingRule) {
	for _, childScan := range scanMap {
			if isCascadedFrom(childScan, scan, rules) {
					childNode := node.Add(childScan.Name)
					buildScanSubtree(childNode, childScan, scanMap, rules)
			}
	}
}

func isCascadedFrom(childScan *v1.Scan, parentScan *v1.Scan, rules []cascadingv1.CascadingRule) bool {
	for _, rule := range rules {
			if matchScanFindings(parentScan, &rule) && rule.Spec.ScanSpec.ScanType == childScan.Spec.ScanType {
					return true
			}
	}
	return false
}

func matchScanFindings(scan *v1.Scan, rule *cascadingv1.CascadingRule) bool {
	for _, matchRule := range rule.Spec.Matches.AnyOf {
			if matchRule.Category != "" {
					if _, exists := scan.Status.Findings.FindingCategories[matchRule.Category]; exists {
							return true
					}
			}
			if matchRule.Severity != "" {
					switch matchRule.Severity {
					case "High":
							if scan.Status.Findings.FindingSeverities.High > 0 {
									return true
							}
					case "Medium":
							if scan.Status.Findings.FindingSeverities.Medium > 0 {
									return true
							}
					case "Low":
							if scan.Status.Findings.FindingSeverities.Low > 0 {
									return true
							}
					case "Informational":
							if scan.Status.Findings.FindingSeverities.Informational > 0 {
									return true
							}
					}
			}
	}
	return false
}
