// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/secureCodeBox/scanners/git-repo-scanner/scanner/internal/config"
	gitreposcanner "github.com/secureCodeBox/scanners/git-repo-scanner/scanner/internal/git_repo_scanner"
	"github.com/secureCodeBox/scanners/git-repo-scanner/scanner/internal/output"
)

var (
	logger = log.New(os.Stdout, "git-repo-scanner - ", log.LstdFlags)
)

func main() {
	config, err := config.ParseFlags(logger)
	if err != nil {
		logger.Fatalf("Error parsing flags: %v", err)
	}

	findings, err := process(config)
	if err != nil {
		logger.Fatalf("Error processing: %v", err)
	}

	logger.Println("Write findings to file...")
	if err := output.WriteFindings(config.FileOutput, findings); err != nil {
		logger.Fatalf("Failed to write findings: %v", err)
	}
	logger.Println("Finished!")
}

func process(config *config.Config) ([]gitreposcanner.Finding, error) {
	var scanner gitreposcanner.GitRepoScanner
	var err error

	var startTime, endTime *time.Time
	now := time.Now().UTC()

	if config.ActivitySinceDuration != nil {
		t := now.Add(-*config.ActivitySinceDuration)
		startTime = &t
	}

	if config.ActivityUntilDuration != nil {
		t := now.Add(-*config.ActivityUntilDuration)
		endTime = &t
	}

	if startTime != nil && endTime != nil && startTime.After(*endTime) {
		return nil, fmt.Errorf("activity-since-duration must be greater than activity-until-duration")
	}

	switch config.GitType {
	case "GitLab":
		// Convert int64 slice to int slice for GitLab
		ignoreRepos := make([]int, len(config.IgnoreRepos))
		for i, id := range config.IgnoreRepos {
			ignoreRepos[i] = int(id)
		}

		scanner, err = gitreposcanner.NewGitLabScanner(
			config.URL,
			config.AccessToken,
			config.Group,
			config.IgnoreGroups,
			ignoreRepos,
			config.ObeyRateLimit,
			config.AnnotateLatestCommitID,
			logger,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to create GitLab scanner: %w", err)
		}

	case "GitHub":
		scanner, err = gitreposcanner.NewGitHubScanner(
			config.URL,
			config.AccessToken,
			config.Organization,
			config.IgnoreRepos,
			config.ObeyRateLimit,
			config.AnnotateLatestCommitID,
			logger,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to create GitHub scanner: %w", err)
		}

	default:
		return nil, fmt.Errorf("unknown git type: %s", config.GitType)
	}

	return scanner.Process(startTime, endTime)
}
