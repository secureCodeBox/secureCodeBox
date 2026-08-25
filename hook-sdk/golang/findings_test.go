// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package hooksdk

import (
	"encoding/json"
	"strings"
	"testing"
)

func validFinding() Finding {
	return Finding{
		ID: "b7ac01f4-daf2-42a1-88d4-3389c5a4d918", ParsedAt: "2026-08-25T10:00:00Z", Name: "Open Telnet", Category: "Open Port", Severity: "HIGH",
		Attributes: map[string]any{"port": float64(23)},
		Scan:       FindingScan{CreatedAt: "2026-08-25T09:00:00Z", Name: "scan", Namespace: "default", ScanType: "nmap"},
	}
}

func TestValidateFinding(t *testing.T) {
	if err := ValidateFinding(validFinding(), 0); err != nil {
		t.Fatal(err)
	}
	finding := validFinding()
	finding.Severity = "CRITICAL"
	if err := ValidateFinding(finding, 0); err == nil {
		t.Fatal("accepted invalid severity")
	}
}

func TestDecodeFindingRejectsUnknownTopLevelFields(t *testing.T) {
	data, err := json.Marshal(validFinding())
	if err != nil {
		t.Fatal(err)
	}
	data = []byte(strings.TrimSuffix(string(data), "}") + `,"ticket":"SCB-1"}`)
	decoder := json.NewDecoder(strings.NewReader(string(data)))
	decoder.DisallowUnknownFields()
	var finding Finding
	if err := decoder.Decode(&finding); err == nil {
		t.Fatal("accepted unknown top-level field")
	}
}

func TestFindingRoundTripKeepsOptionalFieldsOmitted(t *testing.T) {
	data, err := json.Marshal(validFinding())
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(data), `"description"`) || strings.Contains(string(data), `"mitigation"`) {
		t.Fatalf("emitted omitted optional fields: %s", data)
	}
}
