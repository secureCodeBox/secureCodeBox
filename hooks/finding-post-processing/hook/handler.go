// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	hooksdk "github.com/secureCodeBox/secureCodeBox/hook-sdk/golang"
)

type handler struct{ rules []rule }

type rule struct {
	Matches struct {
		AnyOf []findingPatch `json:"anyOf"`
	} `json:"matches"`
	Override findingPatch `json:"override"`
}

// findingPatch intentionally exposes only supported finding fields. Arbitrary
// scanner data is permitted only under attributes.
type findingPatch struct {
	ID           *string              `json:"id,omitempty"`
	IdentifiedAt *string              `json:"identified_at,omitempty"`
	ParsedAt     *string              `json:"parsed_at,omitempty"`
	Name         *string              `json:"name,omitempty"`
	Description  *string              `json:"description,omitempty"`
	Category     *string              `json:"category,omitempty"`
	Severity     *string              `json:"severity,omitempty"`
	Mitigation   *string              `json:"mitigation,omitempty"`
	References   *[]hooksdk.Reference `json:"references,omitempty"`
	Attributes   map[string]any       `json:"attributes,omitempty"`
	Location     *string              `json:"location,omitempty"`
	OSILayer     *string              `json:"osi_layer,omitempty"`
	Scan         *findingScanPatch    `json:"scan,omitempty"`
}

type findingScanPatch struct {
	CreatedAt *string `json:"created_at,omitempty"`
	Name      *string `json:"name,omitempty"`
	Namespace *string `json:"namespace,omitempty"`
	ScanType  *string `json:"scan_type,omitempty"`
}

func newHandler(rulesJSON string) (*handler, error) {
	if rulesJSON == "" {
		return nil, fmt.Errorf("RULES environment variable is required")
	}
	decoder := json.NewDecoder(strings.NewReader(rulesJSON))
	decoder.DisallowUnknownFields()
	var rules []rule
	if err := decoder.Decode(&rules); err != nil {
		return nil, fmt.Errorf("decode RULES: %w", err)
	}
	for index, rule := range rules {
		if len(rule.Matches.AnyOf) == 0 {
			return nil, fmt.Errorf("rule[%d]: matches.anyOf must not be empty", index)
		}
		if rule.Override.Severity != nil && !hooksdk.IsValidSeverity(*rule.Override.Severity) {
			return nil, fmt.Errorf("rule[%d]: override.severity is invalid", index)
		}
	}
	return &handler{rules: rules}, nil
}

func (h *handler) Handle(_ context.Context, request *hooksdk.HookRequest) error {
	findings, err := request.GetFindings()
	if err != nil {
		return err
	}
	matched := false
	for index := range findings {
		for _, rule := range h.rules {
			if matchesAny(findings[index], rule.Matches.AnyOf) {
				matched = true
				applyPatch(&findings[index], rule.Override)
			}
		}
	}
	if matched {
		return request.UpdateFindings(findings)
	}
	return nil
}

func matchesAny(finding hooksdk.Finding, conditions []findingPatch) bool {
	for _, condition := range conditions {
		if matches(finding, condition) {
			return true
		}
	}
	return false
}

func matches(finding hooksdk.Finding, condition findingPatch) bool {
	if condition.ID != nil && *condition.ID != finding.ID || condition.IdentifiedAt != nil && (finding.IdentifiedAt == nil || *condition.IdentifiedAt != *finding.IdentifiedAt) || condition.ParsedAt != nil && *condition.ParsedAt != finding.ParsedAt || condition.Name != nil && *condition.Name != finding.Name || condition.Description != nil && (finding.Description == nil || *condition.Description != *finding.Description) || condition.Category != nil && *condition.Category != finding.Category || condition.Severity != nil && *condition.Severity != finding.Severity || condition.Mitigation != nil && (finding.Mitigation == nil || *condition.Mitigation != *finding.Mitigation) || condition.Location != nil && (finding.Location == nil || *condition.Location != *finding.Location) || condition.OSILayer != nil && *condition.OSILayer != finding.OSILayer {
		return false
	}
	if condition.Attributes != nil && !matchesMap(finding.Attributes, condition.Attributes) {
		return false
	}
	if condition.Scan != nil && !matchesScan(finding.Scan, *condition.Scan) {
		return false
	}
	if condition.References != nil && !matchesReferences(finding.References, *condition.References) {
		return false
	}
	return true
}

func matchesScan(scan hooksdk.FindingScan, patch findingScanPatch) bool {
	return (patch.CreatedAt == nil || *patch.CreatedAt == scan.CreatedAt) && (patch.Name == nil || *patch.Name == scan.Name) && (patch.Namespace == nil || *patch.Namespace == scan.Namespace) && (patch.ScanType == nil || *patch.ScanType == scan.ScanType)
}

func matchesReferences(references, expected []hooksdk.Reference) bool {
	if len(expected) > len(references) {
		return false
	}
	for index, reference := range expected {
		if references[index] != reference {
			return false
		}
	}
	return true
}

func matchesMap(value, expected map[string]any) bool {
	for key, expectedValue := range expected {
		actualValue, found := value[key]
		if !found || !matchesValue(actualValue, expectedValue) {
			return false
		}
	}
	return true
}

func matchesValue(actual, expected any) bool {
	expectedMap, expectedIsMap := expected.(map[string]any)
	if expectedIsMap {
		actualMap, actualIsMap := actual.(map[string]any)
		return actualIsMap && matchesMap(actualMap, expectedMap)
	}
	actualJSON, actualErr := json.Marshal(actual)
	expectedJSON, expectedErr := json.Marshal(expected)
	return actualErr == nil && expectedErr == nil && string(actualJSON) == string(expectedJSON)
}

func applyPatch(finding *hooksdk.Finding, patch findingPatch) {
	if patch.ID != nil {
		finding.ID = *patch.ID
	}
	if patch.IdentifiedAt != nil {
		finding.IdentifiedAt = patch.IdentifiedAt
	}
	if patch.ParsedAt != nil {
		finding.ParsedAt = *patch.ParsedAt
	}
	if patch.Name != nil {
		finding.Name = *patch.Name
	}
	if patch.Description != nil {
		finding.Description = patch.Description
	}
	if patch.Category != nil {
		finding.Category = *patch.Category
	}
	if patch.Severity != nil {
		finding.Severity = *patch.Severity
	}
	if patch.Mitigation != nil {
		finding.Mitigation = patch.Mitigation
	}
	if patch.References != nil {
		finding.References = *patch.References
	}
	if patch.Attributes != nil {
		finding.Attributes = mergeMaps(finding.Attributes, patch.Attributes)
	}
	if patch.Location != nil {
		finding.Location = patch.Location
	}
	if patch.OSILayer != nil {
		finding.OSILayer = *patch.OSILayer
	}
	if patch.Scan != nil {
		applyScanPatch(&finding.Scan, *patch.Scan)
	}
}

func applyScanPatch(scan *hooksdk.FindingScan, patch findingScanPatch) {
	if patch.CreatedAt != nil {
		scan.CreatedAt = *patch.CreatedAt
	}
	if patch.Name != nil {
		scan.Name = *patch.Name
	}
	if patch.Namespace != nil {
		scan.Namespace = *patch.Namespace
	}
	if patch.ScanType != nil {
		scan.ScanType = *patch.ScanType
	}
}

func mergeMaps(destination, override map[string]any) map[string]any {
	if destination == nil {
		destination = make(map[string]any)
	}
	for key, value := range override {
		if overrideMap, ok := value.(map[string]any); ok {
			if destinationMap, ok := destination[key].(map[string]any); ok {
				destination[key] = mergeMaps(destinationMap, overrideMap)
			} else {
				destination[key] = mergeMaps(nil, overrideMap)
			}
		} else {
			destination[key] = value
		}
	}
	return destination
}
