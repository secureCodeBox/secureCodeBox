// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"flag"
	"os"

	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/pkg/aws"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/pkg/config"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/pkg/kubernetes"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
)

func main() {
	var configFile string
	flag.StringVar(&configFile, "config", "",
		"The service will load its initial configuration from this file. "+
			"Omit this flag to use the default configuration values. "+
			"Environment variables override some configuration values from this file.")
	opts := zap.Options{
		Development: true,
	}
	opts.BindFlags(flag.CommandLine)
	flag.Parse()

	log := zap.New(zap.UseFlagOptions(&opts))
	ctrl.SetLogger(log)

	cfg := config.GetConfig(configFile)

	// AWS properties can be set by environment variables too, which have precedence
	// These values can be set both ways to simplify local development and are unlikely to be set when deployed
	region, exists := os.LookupEnv("AWS_REGION")
	if exists {
		cfg.Aws.Region = region
	} else {
		// AWS uses the environment variable to detect the region, set it since it does not exist
		os.Setenv("AWS_REGION", cfg.Aws.Region)
	}
	queueURL, exists := os.LookupEnv("SQS_QUEUE_URL")
	if exists {
		cfg.Aws.QueueUrl = queueURL
	}

	log.Info("read config", "config", cfg)

	reconciler := kubernetes.NewReconciler(&cfg, log)
	awsMonitor := aws.NewMonitorService(&cfg, reconciler, log)

	log.Info("Starting AWS monitoring...")
	awsMonitor.Run(ctrl.SetupSignalHandler())
}
