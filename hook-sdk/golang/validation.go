// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package hooksdk

import (
	"fmt"
	"strings"
	"time"
)

var validSeverities = map[string]bool{
	"INFORMATIONAL": true,
	"LOW":           true,
	"MEDIUM":        true,
	"HIGH":          true,
}

// ValidateFinding validates a finding against the supported secureCodeBox schema.
func ValidateFinding(finding Finding, index int) error {
	if strings.TrimSpace(finding.ID) == "" {
		return fmt.Errorf("finding[%d]: id is required and cannot be empty", index)
	}
	if _, err := time.Parse(time.RFC3339, finding.ParsedAt); err != nil {
		return fmt.Errorf("finding[%d]: parsed_at must be a valid RFC3339 timestamp: %w", index, err)
	}
	if finding.IdentifiedAt != nil {
		if _, err := time.Parse(time.RFC3339, *finding.IdentifiedAt); err != nil {
			return fmt.Errorf("finding[%d]: identified_at must be a valid RFC3339 timestamp: %w", index, err)
		}
	}
	if strings.TrimSpace(finding.Name) == "" {
		return fmt.Errorf("finding[%d]: name is required and cannot be empty", index)
	}
	if strings.TrimSpace(finding.Category) == "" {
		return fmt.Errorf("finding[%d]: category is required and cannot be empty", index)
	}
	if !IsValidSeverity(finding.Severity) {
		return fmt.Errorf("finding[%d]: invalid severity %q, must be one of: INFORMATIONAL, LOW, MEDIUM, HIGH", index, finding.Severity)
	}
	if strings.TrimSpace(finding.Scan.CreatedAt) == "" || strings.TrimSpace(finding.Scan.Name) == "" || strings.TrimSpace(finding.Scan.Namespace) == "" || strings.TrimSpace(finding.Scan.ScanType) == "" {
		return fmt.Errorf("finding[%d]: scan.created_at, scan.name, scan.namespace, and scan.scan_type are required", index)
	}
	if _, err := time.Parse(time.RFC3339, finding.Scan.CreatedAt); err != nil {
		return fmt.Errorf("finding[%d]: scan.created_at must be a valid RFC3339 timestamp: %w", index, err)
	}
	for referenceIndex, reference := range finding.References {
		if strings.TrimSpace(reference.Type) == "" || strings.TrimSpace(reference.Value) == "" {
			return fmt.Errorf("finding[%d]: references[%d] requires type and value", index, referenceIndex)
		}
	}
	return nil
}

// IsValidSeverity checks if a severity value is valid.
func IsValidSeverity(severity string) bool {
	return validSeverities[strings.ToUpper(strings.TrimSpace(severity))]
}
