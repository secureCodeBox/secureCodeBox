// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package hooksdk

import "strings"

// Reference represents external information about a finding.
type Reference struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

// FindingScan identifies the scan that produced a finding.
type FindingScan struct {
	CreatedAt string `json:"created_at"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	ScanType  string `json:"scan_type"`
}

// Finding is the strict secureCodeBox finding representation. Scanner-specific
// data belongs in Attributes; other top-level fields are intentionally rejected.
type Finding struct {
	ID           string         `json:"id"`
	IdentifiedAt *string        `json:"identified_at,omitempty"`
	ParsedAt     string         `json:"parsed_at"`
	Name         string         `json:"name"`
	Description  *string        `json:"description,omitempty"`
	Category     string         `json:"category"`
	Severity     string         `json:"severity"`
	Mitigation   *string        `json:"mitigation,omitempty"`
	References   []Reference    `json:"references,omitempty"`
	Attributes   map[string]any `json:"attributes,omitempty"`
	Location     *string        `json:"location,omitempty"`
	OSILayer     string         `json:"osi_layer,omitempty"`
	Scan         FindingScan    `json:"scan"`
}

// Scan represents a minimal view of the Scan custom resource.
type Scan struct {
	Name        string            `json:"name"`
	Namespace   string            `json:"namespace"`
	UID         string            `json:"uid"`
	Annotations map[string]string `json:"annotations,omitempty"`
	Labels      map[string]string `json:"labels,omitempty"`
	Spec        map[string]any    `json:"spec,omitempty"`
	Status      map[string]any    `json:"status,omitempty"`
}

func severityCount(findings []Finding, severity string) int {
	count := 0
	upperSeverity := strings.ToUpper(severity)
	for _, finding := range findings {
		if strings.ToUpper(finding.Severity) == upperSeverity {
			count++
		}
	}
	return count
}

func buildCategoryMap(findings []Finding) map[string]int {
	categories := make(map[string]int)
	for _, finding := range findings {
		categories[finding.Category]++
	}
	return categories
}
