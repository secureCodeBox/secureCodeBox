// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	batchv1 "k8s.io/api/batch/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/spf13/cobra"
	metav2 "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/types"
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

			follow, _ := cmd.Flags().GetBool("follow")
			if follow {
				return followScanLogs(cmd.Context(), kubeclient, namespace, scanName)
			}
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
	scanCmd.Flags().Bool("follow", false, "Follow the log output of the scan container. Requires kubectl to be installed and in the shell path")

	return scanCmd
}

func followScanLogs(ctx context.Context, kubeclient client.Client, namespace, scanName string) error {
	fmt.Println("⏰ Waiting for scan job to start...")
	const recheckInterval = 250 * time.Millisecond

	for {
		scan := &v1.Scan{}
		err := kubeclient.Get(ctx, types.NamespacedName{Name: scanName, Namespace: namespace}, scan)
		if err != nil {
			return fmt.Errorf("error getting scan: %s", err)
		}

		jobs, err := getJobsForScanOfType(ctx, kubeclient, scan, "scanner")
		if err != nil {
			return fmt.Errorf("error getting jobs for scan: %s", err)
		}

		if len(jobs) == 0 {
			time.Sleep(recheckInterval)
			continue
		}

		job := jobs[0]

		// check if job has started or completed yet (checking for completion in case it finished before we got the ready state)
		if job.Status.CompletionTime == nil && (job.Status.Ready == nil || (*job.Status.Ready == 0)) {
			time.Sleep(recheckInterval)
			continue
		}

		containerName := scanName // Assuming container name matches scan name

		fmt.Printf("📡 Streaming logs for job '%s' and container '%s'\n", job.Name, containerName)

		cmd := exec.CommandContext(ctx, "kubectl", "logs", fmt.Sprintf("job/%s", job.Name), containerName, "--follow", "--namespace", namespace)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr

		if err := cmd.Run(); err != nil {
			return fmt.Errorf("error streaming logs: %s", err)
		}

		break
	}

	return nil
}

func getJobsForScanOfType(ctx context.Context, kubeclient client.Client, scan *v1.Scan, jobType string) ([]batchv1.Job, error) {
	var jobs []batchv1.Job

	scanJobs := &batchv1.JobList{}
	err := kubeclient.List(ctx, scanJobs, &client.ListOptions{
		LabelSelector: labels.SelectorFromSet(map[string]string{"securecodebox.io/job-type": jobType}),
	})
	if err != nil {
		return []batchv1.Job{}, fmt.Errorf("error fetching jobs: %s", err)
	}

	for _, job := range scanJobs.Items {
		for _, jobOwnerReference := range job.GetOwnerReferences() {
			if jobOwnerReference.UID == scan.GetUID() {
				jobs = append(jobs, job)
			}
		}
	}

	return jobs, nil
}
