// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package scancontrollers

import (
	"os"

	"github.com/prometheus/client_golang/prometheus"
	"sigs.k8s.io/controller-runtime/pkg/metrics"
)

var (
	commonMetricLabelScanType = "scan_type"
)

var (
	scansStartedMetric = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "securecodebox_scans_started_count",
			Help: "Number of secureCodeBox scans started",
		},
		[]string{commonMetricLabelScanType},
	)
	scansDoneMetric = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "securecodebox_scans_done_count",
			Help: "Number of secureCodeBox scans that reached state 'done'. Meaning that they have not encountered any errors.",
		},
		[]string{commonMetricLabelScanType},
	)
	scansErroredMetric = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "securecodebox_scans_errored_count",
			Help: "Number of secureCodeBox scans that reached state 'errored'. Meaning that they have encountered errors and were aborted.",
		},
		[]string{commonMetricLabelScanType},
	)
)

var allowIstioSidecarInjectionInJobs = "false"

func init() {
	// Register custom metrics with the global prometheus registry
	metrics.Registry.MustRegister(scansStartedMetric, scansDoneMetric, scansErroredMetric)

	if allowIstioSidecarInjectionInJobsEnv, ok := os.LookupEnv("ALLOW_ISTIO_SIDECAR_INJECTION_IN_JOBS"); ok && (allowIstioSidecarInjectionInJobsEnv == "true" || allowIstioSidecarInjectionInJobsEnv == "false") {
		allowIstioSidecarInjectionInJobs = allowIstioSidecarInjectionInJobsEnv
	}
}
