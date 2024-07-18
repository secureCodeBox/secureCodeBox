// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"flag"
	"os"

	// Import all Kubernetes client auth plugins (e.g. Azure, GCP, OIDC, etc.)
	// to ensure that exec-entrypoint and run can make use of them.
	"github.com/spf13/viper"
	_ "k8s.io/client-go/plugin/pkg/client/auth"

	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/metrics/server"

	"sigs.k8s.io/controller-runtime/pkg/healthz"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"

	"github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/controllers"
	config "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/pkg/config"
	//+kubebuilder:scaffold:imports
)

var (
	scheme   = runtime.NewScheme()
	setupLog = ctrl.Log.WithName("setup")
)

func init() {
	utilruntime.Must(clientgoscheme.AddToScheme(scheme))
	utilruntime.Must(executionv1.AddToScheme(scheme))
	//+kubebuilder:scaffold:scheme
}

func main() {
	var configFile string
	flag.StringVar(&configFile, "config", "",
		"The controller will load its initial configuration from this file. "+
			"Omit this flag to use the default configuration values. "+
			"Command-line flags override configuration from this file.")
	opts := zap.Options{
		Development: true,
	}
	opts.BindFlags(flag.CommandLine)
	flag.Parse()

	ctrl.SetLogger(zap.New(zap.UseFlagOptions(&opts)))

	viper.SetConfigFile(configFile)
	if err := viper.ReadInConfig(); err != nil { // Handle errors reading the config file
		setupLog.Error(err, "unable to load the config file")
		os.Exit(1)
	}

	var ctrlConfig config.AutoDiscoveryConfig
	if err := viper.Unmarshal(&ctrlConfig); err != nil {
		setupLog.Error(err, "unable to decode into struct")
		os.Exit(1)
	}

	setupLog.Info("Got Config", "config", ctrlConfig)

	mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
		Scheme: scheme,
		Metrics: server.Options{
			BindAddress: ctrlConfig.Metrics.BindAddress,
		},
		HealthProbeBindAddress: ctrlConfig.Health.HealthProbeBindAddress,
		LeaderElection:         ctrlConfig.LeaderElection.LeaderElect,
		LeaderElectionID:       ctrlConfig.LeaderElection.ResourceName,
	})
	if err != nil {
		setupLog.Error(err, "unable to start manager")
		os.Exit(1)
	}

	if ctrlConfig.ServiceAutoDiscovery.Enabled {
		if err = (&controllers.ServiceScanReconciler{
			Client:   mgr.GetClient(),
			Recorder: mgr.GetEventRecorderFor("ServiceScanController"),
			Log:      ctrl.Log.WithName("controllers").WithName("ServiceScanController"),
			Scheme:   mgr.GetScheme(),
			Config:   ctrlConfig,
		}).SetupWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create controller", "controller", "ScheduledScan")
			os.Exit(1)
		}
	} else {
		setupLog.Info("ServiceAutoDiscovery is disabled.")
	}

	if ctrlConfig.ContainerAutoDiscovery.Enabled {
		if err = (&controllers.ContainerScanReconciler{
			Client:   mgr.GetClient(),
			Recorder: mgr.GetEventRecorderFor("ContainerScanController"),
			Log:      ctrl.Log.WithName("controllers").WithName("ContainerScanController"),
			Scheme:   mgr.GetScheme(),
			Config:   ctrlConfig,
		}).SetupWithManager(mgr); err != nil {
			setupLog.Error(err, "unable to create controller", "controller", "ScheduledScan")
			os.Exit(1)
		}
	} else {
		setupLog.Info("ContainerAutoDiscovery is disabled.")
	}
	//+kubebuilder:scaffold:builder

	if err := mgr.AddHealthzCheck("healthz", healthz.Ping); err != nil {
		setupLog.Error(err, "unable to set up health check")
		os.Exit(1)
	}
	if err := mgr.AddReadyzCheck("readyz", healthz.Ping); err != nil {
		setupLog.Error(err, "unable to set up ready check")
		os.Exit(1)
	}

	setupLog.Info("starting manager")
	if err := mgr.Start(ctrl.SetupSignalHandler()); err != nil {
		setupLog.Error(err, "problem running manager")
		os.Exit(1)
	}
}
