package cmd

import (
	"context"
	"fmt"

	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	kubernetes "github.com/secureCodeBox/secureCodeBox/scbctl/pkg"
	"github.com/spf13/cobra"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/cli-runtime/pkg/genericclioptions"
)

var kubeconfigArgs = genericclioptions.NewConfigFlags(false)

var ScanCmd = &cobra.Command{
	Use: "scan [name] [target]",
	Short: "Create a new scanner",
	Long:  `Create a new execution (Scan) in the default namespace if no namespace is provided`,
	Example: `
	# Create a new scan
	scbctl scan nmap 
	# Create in a different namespace
	scbctl scan nmap scanme.nmap.org --namespace foobar
	`,
	Run: func(cmd *cobra.Command, args []string) {
		scanName := args[0]
		target := args[1]

		if len(args) < 2 {
			fmt.Println("You must specify the name of the scan and the target")
			return
		}

		fmt.Println("🎬 Initializing Kubernetes client")

		kubeclient, namespace, err := kubernetes.GetClient(kubeconfigArgs)
		if err != nil {
			panic(err)
		}

		
		fmt.Printf("🆕 Creating a new scan with name '%s' and target '%s'\n", scanName, target)

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
				ScanType: scanName,
				Parameters: []string{
					target,
				},
			},
		}

		fmt.Println("🔁 Launching the scan")

		err = kubeclient.Create(context.TODO(), scan)
		if err != nil {
			fmt.Printf("Failed to create Scan: %s", err)
			return
		}

		fmt.Printf("🚀 Successfully created a new Scan '%s'\n", args[0])

	},

}
