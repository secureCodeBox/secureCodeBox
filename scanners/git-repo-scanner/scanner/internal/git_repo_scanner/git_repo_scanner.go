// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package gitreposcanner

import (
	"time"
)

type Finding struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Category    string         `json:"category"`
	OSILayer    string         `json:"osi_layer"`
	Severity    string         `json:"severity"`
	Attributes  map[string]any `json:"attributes"`
}

type GitType string

// GitRepoScanner defines the interface that all scanners must implement
type GitRepoScanner interface {
	GitType() GitType
	Process(startTime, endTime *time.Time) ([]Finding, error)
}

// BaseScanner provides common functionality for scanner implementations
type BaseScanner struct{}

func (b *BaseScanner) CreateFinding(
	gitType GitType,
	repoID string,
	webURL string,
	fullName string,
	ownerType string,
	ownerID string,
	ownerName string,
	createdAt string,
	lastActivityAt string,
	visibility string,
	archived bool,
	topics []string,
	lastCommitID *string,
) Finding {
	finding := Finding{
		Name:        string(gitType) + " Repo",
		Description: "A " + string(gitType) + " repository",
		Category:    "Git Repository",
		OSILayer:    "APPLICATION",
		Severity:    "INFORMATIONAL",
		Attributes: map[string]any{
			"id":               repoID,
			"web_url":          webURL,
			"full_name":        fullName,
			"owner_type":       ownerType,
			"owner_id":         ownerID,
			"topics":           topics,
			"owner_name":       ownerName,
			"created_at":       createdAt,
			"last_activity_at": lastActivityAt,
			"visibility":       visibility,
			"archived":         archived,
		},
	}

	if lastCommitID != nil {
		attributes := finding.Attributes
		attributes["last_commit_id"] = *lastCommitID
	}

	return finding
}
