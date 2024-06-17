// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	"context"
	"errors"
	"fmt"
	"strings"

	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	kubernetes "github.com/secureCodeBox/secureCodeBox/scbctl/pkg"
	"github.com/spf13/cobra"
	metav2 "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/cli-runtime/pkg/genericclioptions"
)

var (
	kubeconfigArgs                           = genericclioptions.NewConfigFlags(false)
	clientProvider kubernetes.ClientProvider = &kubernetes.DefaultClientProvider{}
	scheme                                   = runtime.NewScheme()
)

func init() {
	utilruntime.Must(v1.AddToScheme(scheme))
}

var ScanCmd = &cobra.Command{
	Use:   "scan [name] -- [parameters...]",
	Short: "Create a new scanner",
	Long:  `Create a new execution (Scan) in the default namespace if no namespace is provided`,
	Example: `
	# Create a new scan
	scbctl scan nmap 
	# Create in a different namespace
	scbctl scan --namespace foobar nmap -- scanme.nmap.org -p 90
	`,
	SilenceUsage: true,
	RunE: func(cmd *cobra.Command, args []string) error {

		scanName := args[0]
		paramIndex := cmd.ArgsLenAtDash()
		if paramIndex == -1 {
			return errors.New("You must use '--' to separate scan parameters")
		}

		parameters := args[paramIndex:]

		fmt.Println("🎬 Initializing Kubernetes client")

		kubeclient, namespace, err := clientProvider.GetClient(kubeconfigArgs)
		if err != nil {
			return fmt.Errorf("Error initializing Kubernetes client: %s", err)
		}

		if namespaceFlag, err := cmd.Flags().GetString("namespace"); err == nil && namespaceFlag != "" {
			namespace = namespaceFlag
		}

		fmt.Printf("🆕 Creating a new scan with name '%s' and target '%s'\n", scanName, strings.Join(parameters, " "))

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
			return fmt.Errorf("Failed to create Scan: %s", err)
		}

		fmt.Printf("🚀 Successfully created a new Scan '%s'\n", args[0])
		return nil

	},
}
