// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package telemetry

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/go-logr/logr"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var telemetryInterval = 24 * time.Hour

// officialScanTypes contains the list of official secureCodeBox Scan Types.
// Unofficial Scan Types should be reported as "other" to avoid leakage of confidential data via the scan-types name
var officialScanTypes map[string]bool = map[string]bool{
	"amass":                  true,
	"angularjs-csti-scanner": true,
	"cmseek":                 true,
	"git-repo-scanner":       true,
	"gitleaks":               true,
	"kube-hunter":            true,
	"kubeaudit":              true,
	"ncrack":                 true,
	"nikto":                  true,
	"nmap":                   true,
	"nuclei":                 true,
	"screenshooter":          true,
	"semgrep":                true,
	"ssh-scan":               true,
	"sslyze":                 true,
	"trivy":                  true,
	"typo3scan":              true,
	"whatweb":                true,
	"wpscan":                 true,
	"zap-baseline-scan":      true,
	"zap-api-scan":           true,
	"zap-full-scan":          true,
	"zap-advanced-scan":      true,
}

// telemetryData submitted by operator
type telemetryData struct {
	Version            string   `json:"version"`
	InstalledScanTypes []string `json:"installedScanTypes"`
}

// Loop Submits Telemetry Data in a regular interval
func Loop(apiClient client.Client, log logr.Logger) {
	log.Info("The Operator sends anonymous telemetry data, to give the team an overview how much the secureCodeBox is used. Find out more at https://docs.securecodebox.io/docs/telemetry")

	// Wait 1hour to give users time to uninstall / disable telemetry
	time.Sleep(1 * time.Hour)

	for {
		var version string
		if envVersion, ok := os.LookupEnv("VERSION"); ok {
			version = envVersion
		} else {
			version = "unkown"
		}

		ctx := context.Background()

		installedScanTypes := map[string]bool{}
		var scanTypes executionv1.ScanTypeList
		err := apiClient.List(ctx, &scanTypes, client.InNamespace(metav1.NamespaceAll))

		if err != nil {
			log.Error(err, "Failed to list ScanTypes")
		}
		for _, scanType := range scanTypes.Items {
			installedScanTypes[scanType.Name] = true
		}

		installedScanTypesList := []string{}
		for key := range installedScanTypes {
			if _, ok := officialScanTypes[key]; ok {
				installedScanTypesList = append(installedScanTypesList, key)
			} else {
				installedScanTypesList = append(installedScanTypesList, "other")
			}
		}

		log.Info("Submitting Anonymous Telemetry Data", "Version", version, "InstalledScanTypes", installedScanTypesList)

		reqBody, err := json.Marshal(telemetryData{
			Version:            version,
			InstalledScanTypes: installedScanTypesList,
		})

		if err != nil {
			log.Error(err, "Failed to encode telemetry data to json")
		}
		response, err := http.Post("https://telemetry.chase.securecodebox.io/v1/submit", "application/json", bytes.NewBuffer(reqBody))
		if err != nil {
			log.Error(err, "Failed to send telemetry data")
		}
		if response != nil {
			response.Body.Close()
		}

		time.Sleep(telemetryInterval)
	}
}
