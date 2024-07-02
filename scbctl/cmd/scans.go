// // SPDX-FileCopyrightText: the secureCodeBox authors
// //
// // SPDX-License-Identifier: Apache-2.0
// package cmd

// import (
// 	"context"
// 	"flag"
// 	"fmt"
// 	"io"
// 	"path/filepath"
// 	"strings"

// 	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"

// 	"github.com/spf13/cobra"
// 	corev1 "k8s.io/api/core/v1"
// 	metav2 "k8s.io/apimachinery/pkg/api/errors"
// 	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
// 	"k8s.io/client-go/kubernetes"
// 	"k8s.io/client-go/tools/clientcmd"
// 	"k8s.io/client-go/util/homedir"
// )

// func NewScanCommand() *cobra.Command {
// 	scanCmd := &cobra.Command{
// 		Use:   "scan [scanType] -- [parameters...]",
// 		Short: "Create a new scan",
// 		Long:  `Create a new Scan custom resource in the the current namespace`,
// 		Args:  cobra.MinimumNArgs(1),
// 		Example: `
// 		# Create a new scan
// 		scbctl scan nmap -- scanme.nmap.org

// 		# Create a scan with a custom name
// 		scbctl scan nmap --name scanme-nmap-org -- scanme.nmap.org

// 		# Create a with a different scan type
// 		scbctl scan nuclei -- -target example.com

// 		# Create in a different namespace
// 		scbctl scan --namespace foobar nmap -- -p 80 scanme.nmap.org
// 		`,
// 		SilenceUsage: true,
// 		RunE: func(cmd *cobra.Command, args []string) error {
// 			scanType := args[0]

// 			scanName := scanType
// 			if name, err := cmd.Flags().GetString("name"); err == nil && name != "" {
// 				scanName = name
// 			}
// 			paramIndex := cmd.ArgsLenAtDash()
// 			if paramIndex == -1 {
// 				return fmt.Errorf("you must use '--' to separate scan parameters")
// 			}

// 			parameters := args[paramIndex:]

// 			kubeclient, namespace, err := clientProvider.GetClient(kubeconfigArgs)
// 			if err != nil {
// 				return fmt.Errorf("error initializing kubernetes client. your kubeconfig is likely malformed or invalid. %s", err)
// 			}

// 			if namespaceFlag, err := cmd.Flags().GetString("namespace"); err == nil && namespaceFlag != "" {
// 				namespace = namespaceFlag
// 			}

// 			fmt.Printf("🆕 Creating a new scan with name '%s' and parameters '%s'\n", scanName, strings.Join(parameters, " "))

// 			scan := &v1.Scan{
// 				TypeMeta: metav1.TypeMeta{
// 					Kind:       "Scan",
// 					APIVersion: "execution.securecodebox.io/v1",
// 				},
// 				ObjectMeta: metav1.ObjectMeta{
// 					Name:      scanName,
// 					Namespace: namespace,
// 				},
// 				Spec: v1.ScanSpec{
// 					ScanType:   scanType,
// 					Parameters: parameters,
// 				},
// 			}

// 			err = kubeclient.Create(cmd.Context(), scan)
// 			if err != nil {
// 				if metav2.IsNotFound(err) {
// 					return fmt.Errorf("failed to create Scan: namespace '%s' not found", namespace)
// 				}
// 				return fmt.Errorf("failed to create scan: %s", err)
// 			}

// 			fmt.Printf("🚀 Successfully created a new Scan '%s'\n", scanName)

// 			follow, err := cmd.Flags().GetBool("follow")
// 			if err != nil {
// 				return fmt.Errorf("error retrieving 'follow' flag: %s", err)
// 			}

// 			if follow {
// 				err = followScanLogs(namespace, scanName)
// 				if err != nil {
// 					return fmt.Errorf("error following scan job logs: %s", err)
// 				}
// 			}

// 			return nil
// 		},
// 	}

// 	scanCmd.Flags().String("name", "", "Name of the created scan. If no name is provided, the ScanType will be used as the name")
// 	scanCmd.Flags().Bool("follow", false, "Follow logs of the scan job")

// 	return scanCmd
// }

// func followScanLogs(namespace string, scanName string) error {
// 	var kubeconfig *string
// 	if home := homedir.HomeDir(); home != "" {
// 		kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "(optional) absolute path to the kubeconfig file")
// 	} else {
// 		kubeconfig = flag.String("kubeconfig", "", "absolute path to the kubeconfig file")
// 	}
// 	flag.Parse()

// 	config, err := clientcmd.BuildConfigFromFlags("", *kubeconfig)
// 	if err != nil {
// 		return fmt.Errorf("error building kubeconfig: %s", err)
// 	}

// 	clientset, err := kubernetes.NewForConfig(config)
// 	if err != nil {
// 		return fmt.Errorf("error creating kubernetes client: %s", err)
// 	}

// 	for {
// 		podList, err := clientset.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
// 		if err != nil {
// 			return fmt.Errorf("failed to list pods: %s", err)
// 		}

// 		if len(podList.Items) == 0 {
// 			return fmt.Errorf("no pods found for scan '%s'", scanName)
// 		}
// 		var podName string
// 		for _, p := range podList.Items {
// 					if strings.HasPrefix(p.Name, fmt.Sprintf("scan-%s", scanName)) {
// 						podName = p.Name
// 						break
// 				}
// 		}
// 		if podName == "" {
// 			fmt.Printf("Failled to get podname")
// 		}

// 		// if pob == nil {
// 		// 		fmt.Println("Waiting for job to be created...")
// 		// 		time.Sleep(2 * time.Second)
// 		// 		continue
// 		// }

// 		// jobName := job.Name
// 		// containerName := scanName

// 		fmt.Printf("📄 Following logs for pod '%s'\n", podName)

// 		req := clientset.CoreV1().Pods(namespace).GetLogs(podName, &corev1.PodLogOptions{Follow: true})
// 		readCloser, err := req.Stream(context.TODO())
// 		if err != nil {
// 			return fmt.Errorf("failed to stream logs: %s", err)
// 		}
// 		defer readCloser.Close()

// 		_, err = io.Copy(io.Discard, readCloser)
// 		if err != nil {
// 			return fmt.Errorf("error copying log output: %s", err)
// 		}
// 		break

// 	}
// 	return nil
// }

// SPDX-License-IdentifierText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	"context"
	"flag"
	"fmt"
	"io"
	"path/filepath"
	"strings"

	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"

	"github.com/spf13/cobra"
	corev1 "k8s.io/api/core/v1"
	metav2 "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
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
			var kubeconfig *string
			if home := homedir.HomeDir(); home != "" {
				kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "(optional) absolute path to the kubeconfig file")
			} else {
				kubeconfig = flag.String("kubeconfig", "", "absolute path to the kubeconfig file")
			}
			flag.Parse()
			config, err := clientcmd.BuildConfigFromFlags("", *kubeconfig)
			if err != nil {
				return fmt.Errorf("error building kubeconfig: %s", err)
			}

			clientset, err := kubernetes.NewForConfig(config)
			if err != nil {
				return fmt.Errorf("error creating kubernetes client: %s", err)
			}

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

			err = clientset.RESTClient().
				Post().AbsPath("execution.securecodebox.io").
				Namespace(namespace).
				Resource("scans").
				Body(scan).
				Do(context.TODO()).
				Into(scan)
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
				err = followScanLogs(clientset, namespace, scanName)
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

func followScanLogs(clientset *kubernetes.Clientset, namespace, scanName string) error {
	podList, err := clientset.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return fmt.Errorf("failed to list pods: %s", err)
	}

	if len(podList.Items) == 0 {
		return fmt.Errorf("no pods found for scan '%s'", scanName)
	}

	podName := podList.Items[0].Name
	fmt.Printf("📄 Following logs for pod '%s'\n", podName)

	req := clientset.CoreV1().Pods(namespace).GetLogs(podName, &corev1.PodLogOptions{Follow: true})
	readCloser, err := req.Stream(context.TODO())
	if err != nil {
		return fmt.Errorf("failed to stream logs: %s", err)
	}
	defer readCloser.Close()

	_, err = io.Copy(io.Discard, readCloser)
	if err != nil {
		return fmt.Errorf("error copying log output: %s", err)
	}

	return nil
}
