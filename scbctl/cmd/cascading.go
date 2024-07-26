package cmd

import (
	"context"
	"fmt"
	"io"

	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"github.com/spf13/cobra"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"k8s.io/cli-runtime/pkg/printers"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type cascadeOptions struct {
	configFlags *genericclioptions.ConfigFlags
	genericclioptions.IOStreams

	namespace string
}

func NewCascadeCommand(streams genericclioptions.IOStreams) *cobra.Command {
	o := &cascadeOptions{
		configFlags: genericclioptions.NewConfigFlags(true),
		IOStreams:   streams,
	}

	cmd := &cobra.Command{
		Use:   "cascade",
		Short: "Visualize cascading rules and scan flow",
		Long:  `Display a tree-like structure of scans and their cascading rules in a specified namespace`,
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := o.Complete(cmd); err != nil {
				return err
			}
			if err := o.Validate(); err != nil {
				return err
			}
			if err := o.Run(); err != nil {
				return err
			}
			return nil
		},
	}

	cmd.Flags().StringVarP(&o.namespace, "namespace", "n", "", "Namespace to visualize cascading rules for")
	o.configFlags.AddFlags(cmd.Flags())

	return cmd
}

func (o *cascadeOptions) fetchScansAndRules(c client.Client) ([]v1.Scan, []v1.CascadeSpec, error) {
	var scanList v1.ScanList
	var ruleList []v1.CascadeSpec

	err := c.List(context.Background(), &scanList, client.InNamespace(o.namespace))
	if err != nil {
		return nil, nil, err
	}

	err = c.List(context.Background(), &ruleList, client.InNamespace(o.namespace))
	if err != nil {
		return nil, nil, err
	}

	return scanList.Items, ruleList.Items, nil
}

type treeNode struct {
	scan     *v1.Scan
	children []*treeNode
}

func (o *cascadeOptions) buildCascadeTree(scans []v1.Scan, rules []v1.CascadeSpec) *treeNode {
	scanMap := make(map[string]*treeNode)
	for i := range scans {
		scanMap[scans[i].Name] = &treeNode{scan: &scans[i]}
	}

	root := &treeNode{}

	for _, rule := range rules {
		for _, scan := range scans {
			if o.scanMatchesRule(&scan, &rule) {
				childScan := scanMap[rule.]
				if childScan != nil {
					scanMap[scan.Name].children = append(scanMap[scan.Name].children, childScan)
				}
			}
		}
	}

	for _, node := range scanMap {
		if node.scan.Spec.InitialScan {
			root.children = append(root.children, node)
		}
	}

	return root
}

func (o *cascadeOptions) renderTree(root *treeNode, out io.Writer) {
	w := printers.GetNewTabWriter(out)
	defer w.Flush()

	fmt.Fprintln(w, "SCAN TYPE\tNAME\tSTATUS")
	o.renderNode(root, "", w)
}

func (o *cascadeOptions) renderNode(node *treeNode, prefix string, w io.Writer) {
	if node.scan != nil {
		fmt.Fprintf(w, "%s%s\t%s\t%s\n", prefix, node.scan.Spec.ScanType, node.scan.Name, string(node.scan.Status.State))
	}

	childPrefix := prefix + "└── "
	for i, child := range node.children {
		if i == len(node.children)-1 {
			childPrefix = prefix + "└── "
		} else {
			childPrefix = prefix + "├── "
		}
		o.renderNode(child, childPrefix, w)
	}
}
