// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"fmt"
	"os"

	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/aws"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/kubernetes"
)

func main() {
	namespace := os.Getenv("SCB_NAMESPACE")
	queueURL := os.Getenv("SQS_QUEUE_URL")

	awsReconciler := kubernetes.NewAWSReconciler(namespace)
	awsMonitor := aws.NewMonitorService(queueURL, awsReconciler)

	fmt.Println("Starting AWS monitoring...")
	awsMonitor.Run()
}
