// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package scancontrollers

import (
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

func init() {
	// Register custom metrics with the global prometheus registry
	metrics.Registry.MustRegister(scansStartedMetric, scansDoneMetric, scansErroredMetric)
}
