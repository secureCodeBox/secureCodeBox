// SPDX-License-IdentifierText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	client "github.com/secureCodeBox/secureCodeBox/scbctl/pkg"

	"github.com/spf13/cobra"
	corev1 "k8s.io/api/core/v1"
	metav2 "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes"
)

func NewScanCommand() *cobra.Command {
	scanCmd := &cobra.Command{
		Use:   "scan [scanType] -- [parameters...]",
		Short: "Create a new scan",
		Long:  `Create a new Scan custom resource in the current namespace`,
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
			clientset, dynamicClient, err := client.GetClient(kubeconfigArgs)

			namespace := metav1.NamespaceDefault
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
			scamVGR := schema.GroupVersionResource{
				Group: "execution.securecodebox.io",
				Version: "v1",
				Resource: "scans",
			}

			unstructuredScan, err := runtime.DefaultUnstructuredConverter.ToUnstructured(scan)
			if err != nil{
				return fmt.Errorf("Failed to restructure scan object: %s", err)
			}
			_, err = dynamicClient.Resource(scamVGR).Namespace(namespace).Create(cmd.Context(), &unstructured.Unstructured{Object: unstructuredScan}, metav1.CreateOptions{},)
			if err != nil {
				if metav2.IsNotFound(err) {
					return fmt.Errorf("failed to create Scan: namespace '%s' not found", namespace)
				}
				return fmt.Errorf("failed to create scan: %s", err)
			}

			fmt.Printf("🚀 Successfully created a new Scan '%s'\n", scanName)

			follow, err := cmd.Flags().GetBool("follow")
			if err != nil {
				return fmt.Errorf("error retrieving 'follow' flag: %s", err)
			}

			if follow {
				err = followScanLogs(cmd.Context(), clientset, namespace, scanName)
				if err != nil {
					return fmt.Errorf("error following scan logs: %s", err)
				}
			}

			return nil
		},
	}

	scanCmd.Flags().String("name", "", "Name of the created scan. If no name is provided, the ScanType will be used as the name")
	scanCmd.Flags().Bool("follow", false, "Follow logs of the scan job")

	return scanCmd
}

func followScanLogs(context context.Context, clientset *kubernetes.Clientset, namespace, scanName string) error {
	fmt.Printf("Waiting for scan '%s' to start...\n", scanName)

	for {
			podList, err := clientset.CoreV1().Pods(namespace).List(context, metav1.ListOptions{})
			if err != nil {
					return fmt.Errorf("failed to list pods: %s", err)
			}

			var podName string
			for _, pod := range podList.Items {
					if strings.HasPrefix(pod.Name, fmt.Sprintf("scan-%s-", scanName)) {
							podName = pod.Name
							break
					}
			}

			if podName != "" {
					fmt.Printf("📄 Following logs for pod '%s', container 'nmap'\n", podName)

					req := clientset.CoreV1().Pods(namespace).GetLogs(podName, &corev1.PodLogOptions{
							Follow:    true,
							Container: scanName,
					})
					readCloser, err := req.Stream(context)
					if err != nil {
							return fmt.Errorf("failed to stream logs: %s", err)
					}
					defer readCloser.Close()

					_, err = io.Copy(os.Stdout, readCloser)
					if err != nil && err != io.EOF {
							return fmt.Errorf("error copying log output: %s", err)
					}

					return nil
			}

			time.Sleep(2 * time.Second)
	}
}
