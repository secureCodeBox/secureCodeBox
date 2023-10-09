// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"os"

	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/aws"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/kubernetes"
)

func main() {
	namespace := os.Getenv("SCB_NAMESPACE")
	queueURL := os.Getenv("SQS_QUEUE_URL")

	log := kubernetes.InitializeLogger()
	awsReconciler := kubernetes.NewAWSReconciler(namespace, log)
	awsMonitor := aws.NewMonitorService(queueURL, awsReconciler, log)

	log.Info("Starting AWS monitoring...")
	awsMonitor.Run(context.Background())
}
