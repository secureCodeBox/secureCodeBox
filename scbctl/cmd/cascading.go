// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	"context"
	"fmt"
	"os"

	"github.com/ddddddO/gtree"
	cascadingv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/cascading/v1"
	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"github.com/spf13/cobra"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/selection"
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
		Use: "cascade",
		Short: "Display cascade of scans",
		Long: `Display a tree-like structure showing the flow from initial scans to subsquent scans within a specified kubernetes namespace`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return runCascade(cmd)
		},
	}

	cascadeCmd.Flags().String("namespace", "", "Namespace to scans from")
	//cascadeCmd.MarkFlagRequired("namespace")
	return cascadeCmd
}


func runCascade(cmd *cobra.Command) error {
	namespace, _ := cmd.Flags().GetString("namespace")

	kubeclient, _, err := clientProvider.GetClient(kubeconfigArgs)
	if err != nil {
			return fmt.Errorf("error initializing kubernetes client: %w", err)
	}

	scans, err := fetchScans(cmd.Context(), kubeclient, namespace)
	if err != nil {
			return fmt.Errorf("error fetching scans: %w", err)
	}

	cascadingRules, err := fetchCascadingRules(cmd.Context(), kubeclient, namespace)
	if err != nil {
			return fmt.Errorf("error fetching cascading rules: %w", err)
	}

	tree := buildTree(scans, cascadingRules)

	if err := gtree.OutputProgrammably(os.Stdout, tree); err != nil {
			return fmt.Errorf("error outputting tree: %w", err)
	}

	return nil
}

func fetchScans(ctx context.Context, client client.Client, namespace string) ([]v1.Scan, error) {
	var scanList v1.ScanList
	if err := client.List(ctx, &scanList); err != nil {
			return nil, fmt.Errorf("error listing scans: %w", err)
	}
	return scanList.Items, nil
}

func fetchCascadingRules(ctx context.Context, client client.Client, namespace string) ([]cascadingv1.CascadingRule, error) {
	var ruleList cascadingv1.CascadingRuleList
	if err := client.List(ctx, &ruleList); err != nil {
			return nil, fmt.Errorf("error listing cascading rules: %w", err)
	}
	return ruleList.Items, nil
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

func isCascadedFrom(childScan, parentScan *v1.Scan, rules []cascadingv1.CascadingRule) bool {
	if !childScan.CreationTimestamp.After(parentScan.CreationTimestamp.Time) {
			return false
	}

	if parentScan.Spec.Cascades == nil {
			return false
	}

	selector := createSelectorFromCascadeSpec(parentScan.Spec.Cascades)

	for _, rule := range rules {
			if selector.Matches(labels.Set(rule.Labels)) && ruleMatchesScan(rule, parentScan) && childMatchesRule(childScan, rule) {
					return true
			}
	}

	return false
}

func createSelectorFromCascadeSpec(cascadeSpec *v1.CascadeSpec) labels.Selector {
	selector := labels.NewSelector()

	for key, value := range cascadeSpec.MatchLabels {
			req, _ := labels.NewRequirement(key, selection.Equals, []string{value})
			selector = selector.Add(*req)
	}

	for _, expr := range cascadeSpec.MatchExpressions {
			var op selection.Operator
			switch expr.Operator {
			case metav1.LabelSelectorOpIn:
					op = selection.In
			case metav1.LabelSelectorOpNotIn:
					op = selection.NotIn
			case metav1.LabelSelectorOpExists:
					op = selection.Exists
			case metav1.LabelSelectorOpDoesNotExist:
					op = selection.DoesNotExist
			default:
					continue
			}
			req, _ := labels.NewRequirement(expr.Key, op, expr.Values)
			selector = selector.Add(*req)
	}

	return selector
}
func ruleMatchesScan(rule cascadingv1.CascadingRule, scan *v1.Scan) bool {
	for _, matchRule := range rule.Spec.Matches.AnyOf {
			if matchesFinding(scan, matchRule) {
					return true
			}
	}
	return false
}

func matchesFinding(scan *v1.Scan, matchRule cascadingv1.MatchesRule) bool {
	if matchRule.Category != "" && scan.Status.State != matchRule.Category {
			return false
	}
	return true
}

func childMatchesRule(childScan *v1.Scan, rule cascadingv1.CascadingRule) bool {
	return childScan.Spec.ScanType == rule.Spec.ScanSpec.ScanType
}
