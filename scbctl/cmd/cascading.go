// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/ddddddO/gtree"
	cascadingv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/cascading/v1"
	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"github.com/spf13/cobra"
	"k8s.io/apimachinery/pkg/util/intstr"
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

func buildScanSubtree(node *gtree.Node, scan *v1.Scan, scanMap map[string]*v1.Scan, rules []cascadingv1.CascadingRule) {
	for _, childScan := range getChildScans(scan, scanMap, rules) {
			childNode := node.Add(childScan.Name)
			buildScanSubtree(childNode, childScan, scanMap, rules)
	}
}


func getChildScans(parentScan *v1.Scan, scanMap map[string]*v1.Scan, rules []cascadingv1.CascadingRule) []*v1.Scan {
	var childScans []*v1.Scan

	for _, scan := range scanMap {
			if isCascadedFrom(scan, parentScan, rules) {
					childScans = append(childScans, scan)
			}
	}

	return childScans
}

func isCascadedFrom(childScan, parentScan *v1.Scan, rules []cascadingv1.CascadingRule) bool {
	// Check if the child was created after the parent
	if !childScan.CreationTimestamp.After(parentScan.CreationTimestamp.Time) {
			return false
	}

	// Check for a specific annotation indicating the parent scan
	if parentScanName, exists := childScan.Annotations["parentScan"]; exists && parentScanName == parentScan.Name {
			return true
	}

	// Check if any CascadingRule matches
	for _, rule := range rules {
			if matchesRule(parentScan, rule) && scanMatchesSpec(childScan, rule.Spec.ScanSpec) {
					return true
			}
	}

	return false
}

func matchesRule(scan *v1.Scan, rule cascadingv1.CascadingRule) bool {
    for _, matchRule := range rule.Spec.Matches.AnyOf {
        if matchesFinding(scan, matchRule) {
            return true
        }
    }
    return false
}

func matchesFinding(scan *v1.Scan, matchRule cascadingv1.MatchesRule) bool {
    // This is a simplified matching logic. You may need to adjust it based on how
    // your findings are stored and how you want to match them.
    
    // For this example, we'll assume that findings are stored as annotations on the Scan
    // with keys like "finding.category", "finding.severity", etc.
    
    if matchRule.Category != "" && scan.Annotations["finding.category"] != matchRule.Category {
        return false
    }
    if matchRule.Severity != "" && scan.Annotations["finding.severity"] != matchRule.Severity {
        return false
    }
    if matchRule.OsiLayer != "" && scan.Annotations["finding.osi_layer"] != matchRule.OsiLayer {
        return false
    }
    
    // Check attributes
    for key, value := range matchRule.Attributes {
        scanValue, exists := scan.Annotations["finding.attribute."+key]
        if !exists {
            return false
        }
        if value.Type == intstr.String && scanValue != value.StrVal {
            return false
        }
        // For Int type, you'd need to parse the scanValue to int and compare
        // This is left as an exercise as it depends on how you store int values in annotations
    }
    
    return true
}

func scanMatchesSpec(scan *v1.Scan, spec v1.ScanSpec) bool {
    // Check if the scan type matches
    if scan.Spec.ScanType != spec.ScanType {
        return false
    }
    
    if len(scan.Spec.Parameters) != len(spec.Parameters) {
        return false
    }
    for i, param := range scan.Spec.Parameters {
        if param != spec.Parameters[i] {
            return false
        }
    }
    
    
    return true
}
// func isCascadedFrom(childScan, parentScan *v1.Scan) bool {
// 	// Check if the parent scan has a CascadeSpec
// 	if parentScan.Spec.Cascades == nil {
// 			return false
// 	}

// 	// Check if the child was created after the parent
// 	if !childScan.CreationTimestamp.After(parentScan.CreationTimestamp.Time) {
// 			return false
// 	}

// 	// Check for a specific annotation indicating the parent scan
// 	if parentScanName, exists := childScan.Annotations["parentScan"]; exists && parentScanName == parentScan.Name {
// 			return true
// 	}

// 	// Create a label selector from the parent's CascadeSpec
// 	selector := labels.SelectorFromSet(parentScan.Spec.Cascades.MatchLabels)

// 	// Add the MatchExpressions to the selector
// 	for _, expr := range parentScan.Spec.Cascades.MatchExpressions {
// 			var op selection.Operator
// 			switch expr.Operator {
// 			case metav1.LabelSelectorOpIn:
// 					op = selection.In
// 			case metav1.LabelSelectorOpNotIn:
// 					op = selection.NotIn
// 			case metav1.LabelSelectorOpExists:
// 					op = selection.Exists
// 			case metav1.LabelSelectorOpDoesNotExist:
// 					op = selection.DoesNotExist
// 			default:
// 					// Skip invalid operators
// 					continue
// 			}
// 			r, err := labels.NewRequirement(expr.Key, op, expr.Values)
// 			if err == nil {
// 					selector = selector.Add(*r)
// 			}
// 	}

// 	// Check if the child scan's labels match the selector
// 	return selector.Matches(labels.Set(childScan.Labels))
// }

func isInitialScan(scan *v1.Scan) bool {
	log.Printf("Checking if scan %s is an initial scan", scan.Name)

	if value, exists := scan.Labels["initialScan"]; exists && value == "true" {
			log.Printf("Scan %s is an initial scan (initialScan label)", scan.Name)
			return true
	}
	if value, exists := scan.Annotations["initialScan"]; exists && value == "true" {
			log.Printf("Scan %s is an initial scan (initialScan annotation)", scan.Name)
			return true
	}

	if _, exists := scan.Annotations["parentScan"]; exists {
			log.Printf("Scan %s is not an initial scan (has parentScan annotation)", scan.Name)
			return false
	}

	if scan.Spec.Cascades != nil {
			log.Printf("Scan %s is not an initial scan (has Cascade spec)", scan.Name)
			return false
	}

	if len(scan.OwnerReferences) == 0 {
			log.Printf("Scan %s is an initial scan (no owner references)", scan.Name)
			return true
	}

	log.Printf("Scan %s is assumed to be an initial scan", scan.Name)
	return true
}
