// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"testing"

	hooksdk "github.com/secureCodeBox/secureCodeBox/hook-sdk/golang"
)

func testFinding() hooksdk.Finding {
	return hooksdk.Finding{
		ID: "b7ac01f4-daf2-42a1-88d4-3389c5a4d918", ParsedAt: "2026-08-25T10:00:00Z", Name: "Open Telnet", Category: "Open Port", Severity: "LOW",
		Attributes: map[string]any{"hostname": "example.com", "port": float64(23), "state": "open"},
		Scan:       hooksdk.FindingScan{CreatedAt: "2026-08-25T09:00:00Z", Name: "scan", Namespace: "default", ScanType: "nmap"},
	}
}

func TestHandlerAppliesTypedRuleAndMergesAttributes(t *testing.T) {
	handler, err := newHandler(`[{"matches":{"anyOf":[{"category":"Open Port","attributes":{"port":23}}]},"override":{"severity":"HIGH","description":"Telnet is bad","attributes":{"port":42,"ticket":"SCB-1"}}}]`)
	if err != nil {
		t.Fatal(err)
	}
	findings := []hooksdk.Finding{testFinding()}
	updated := false
	err = handler.Handle(context.Background(), &hooksdk.HookRequest{
		GetFindings:    func() ([]hooksdk.Finding, error) { return findings, nil },
		UpdateFindings: func(result []hooksdk.Finding) error { updated = true; findings = result; return nil },
	})
	if err != nil {
		t.Fatal(err)
	}
	if !updated || findings[0].Severity != "HIGH" || findings[0].Description == nil || *findings[0].Description != "Telnet is bad" {
		t.Fatalf("rule was not applied: %#v", findings[0])
	}
	if findings[0].Attributes["hostname"] != "example.com" || findings[0].Attributes["ticket"] != "SCB-1" {
		t.Fatalf("attributes were not merged: %#v", findings[0].Attributes)
	}
}

func TestHandlerDoesNotUpdateWhenNoRuleMatches(t *testing.T) {
	handler, err := newHandler(`[{"matches":{"anyOf":[{"category":"Other"}]},"override":{"severity":"HIGH"}}]`)
	if err != nil {
		t.Fatal(err)
	}
	updated := false
	err = handler.Handle(context.Background(), &hooksdk.HookRequest{
		GetFindings:    func() ([]hooksdk.Finding, error) { return []hooksdk.Finding{testFinding()}, nil },
		UpdateFindings: func([]hooksdk.Finding) error { updated = true; return nil },
	})
	if err != nil {
		t.Fatal(err)
	}
	if updated {
		t.Fatal("updated findings without a matching rule")
	}
}

func TestHandlerRejectsUnknownTopLevelRuleFields(t *testing.T) {
	if _, err := newHandler(`[{"matches":{"anyOf":[{"ticket":"SCB-1"}]},"override":{"severity":"HIGH"}}]`); err == nil {
		t.Fatal("accepted unknown match field")
	}
	if _, err := newHandler(`[{"matches":{"anyOf":[{"category":"Open Port"}]},"override":{"ticket":"SCB-1"}}]`); err == nil {
		t.Fatal("accepted unknown override field")
	}
}

func TestHandlerAppliesRulesInOrder(t *testing.T) {
	handler, err := newHandler(`[{"matches":{"anyOf":[{"category":"Open Port"}]},"override":{"severity":"HIGH"}},{"matches":{"anyOf":[{"severity":"HIGH"}]},"override":{"mitigation":"disable telnet"}}]`)
	if err != nil {
		t.Fatal(err)
	}
	findings := []hooksdk.Finding{testFinding()}
	err = handler.Handle(context.Background(), &hooksdk.HookRequest{GetFindings: func() ([]hooksdk.Finding, error) { return findings, nil }, UpdateFindings: func(result []hooksdk.Finding) error { findings = result; return nil }})
	if err != nil {
		t.Fatal(err)
	}
	if findings[0].Mitigation == nil || *findings[0].Mitigation != "disable telnet" {
		t.Fatalf("later rule did not observe earlier override: %#v", findings[0])
	}
}
