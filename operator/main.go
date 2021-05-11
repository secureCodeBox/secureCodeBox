// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"flag"
	"os"
	"time"

	"k8s.io/apimachinery/pkg/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	_ "k8s.io/client-go/plugin/pkg/client/auth/gcp"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"

	cascadingv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/cascading/v1"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	executioncontroller "github.com/secureCodeBox/secureCodeBox/operator/controllers/execution"
	scancontroller "github.com/secureCodeBox/secureCodeBox/operator/controllers/execution/scans"
	"github.com/secureCodeBox/secureCodeBox/operator/internal/telemetry"
	// +kubebuilder:scaffold:imports
)

var (
	scheme   = runtime.NewScheme()
	setupLog = ctrl.Log.WithName("setup")
)

func init() {
	_ = clientgoscheme.AddToScheme(scheme)

	_ = executionv1.AddToScheme(scheme)
	_ = cascadingv1.AddToScheme(scheme)
	// +kubebuilder:scaffold:scheme
}

func main() {
	var metricsAddr string
	var enableLeaderElection bool
	flag.StringVar(&metricsAddr, "metrics-addr", ":8080", "The address the metric endpoint binds to.")
	flag.BoolVar(&enableLeaderElection, "enable-leader-election", false,
		"Enable leader election for controller manager. "+
			"Enabling this will ensure there is only one active controller manager.")
	flag.Parse()

	ctrl.SetLogger(zap.New(zap.UseDevMode(true)))

	leaseDuration := 30 * time.Second
	renewDeadline := 20 * time.Second

	mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
		Scheme:             scheme,
		MetricsBindAddress: metricsAddr,
		Port:               9443,
		LeaderElection:     enableLeaderElection,
		LeaderElectionID:   "e341d981.securecodebox.io",
		LeaseDuration:      &leaseDuration,
		RenewDeadline:      &renewDeadline,
	})
	if err != nil {
		setupLog.Error(err, "unable to start manager")
		os.Exit(1)
	}

	if err = (&scancontroller.ScanReconciler{
		Client: mgr.GetClient(),
		Log:    ctrl.Log.WithName("controllers").WithName("Scan"),
		Scheme: mgr.GetScheme(),
	}).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "Scan")
		os.Exit(1)
	}
	if err = (&executioncontroller.ScheduledScanReconciler{
		Client: mgr.GetClient(),
		Log:    ctrl.Log.WithName("controllers").WithName("ScheduledScan"),
		Scheme: mgr.GetScheme(),
	}).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "ScheduledScan")
		os.Exit(1)
	}
	// +kubebuilder:scaffold:builder

	if enabled, ok := os.LookupEnv("TELEMETRY_ENABLED"); ok && enabled == "true" {
		go telemetry.Loop(mgr.GetClient(), ctrl.Log.WithName("telemetry"))
	}

	setupLog.Info("starting manager")
	if err := mgr.Start(ctrl.SetupSignalHandler()); err != nil {
		setupLog.Error(err, "problem running manager")
		os.Exit(1)
	}
}
