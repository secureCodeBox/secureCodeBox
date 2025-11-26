// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package config

import (
	"flag"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/secureCodeBox/scanners/git-repo-scanner/scanner/internal/duration"
)

type Config struct {
	GitType                string
	FileOutput             string
	URL                    string
	AccessToken            string
	Organization           string
	Group                  *int
	IgnoreRepos            []int64
	IgnoreGroups           []int
	ObeyRateLimit          bool
	AnnotateLatestCommitID bool
	ActivitySinceDuration  *time.Duration
	ActivityUntilDuration  *time.Duration
}

func ParseFlags(logger *log.Logger) (*Config, error) {
	config := &Config{}

	// Define flags
	flag.StringVar(&config.GitType, "git-type", "", "Repository type can be GitHub or GitLab")
	flag.StringVar(&config.FileOutput, "file-output", "", "The path of the output file")
	flag.StringVar(&config.URL, "url", "", "The GitLab url or a GitHub enterprise api url")
	flag.StringVar(&config.AccessToken, "access-token", "", "An access token for authentication")
	flag.StringVar(&config.Organization, "organization", "", "The name of the GitHub organization to scan")

	var groupStr string
	flag.StringVar(&groupStr, "group", "", "The id of the GitLab group to scan")

	var ignoreReposStr string
	flag.StringVar(&ignoreReposStr, "ignore-repos", "", "Comma-separated list of repo ids to ignore")

	var ignoreGroupsStr string
	flag.StringVar(&ignoreGroupsStr, "ignore-groups", "", "Comma-separated list of GitLab group ids to ignore")

	flag.BoolVar(&config.ObeyRateLimit, "obey-rate-limit", true,
		"True to obey the rate limit of the GitLab or GitHub server (default), otherwise false")
	flag.BoolVar(&config.AnnotateLatestCommitID, "annotate-latest-commit-id", false,
		"Annotate the results with the latest commit hash of the main branch of the repository")

	var activitySinceStr string
	var activityUntilStr string
	flag.StringVar(&activitySinceStr, "activity-since-duration", "",
		"Return git repo findings with repo activity more recent than a specific duration (e.g., '7d', '2w', '1h')")
	flag.StringVar(&activityUntilStr, "activity-until-duration", "",
		"Return git repo findings with repo activity older than a specific duration (e.g., '7d', '2w', '1h')")

	flag.Parse()

	if err := config.validate(); err != nil {
		flag.Usage()
		return nil, err
	}

	if err := config.parseOptionalFields(groupStr, ignoreReposStr, ignoreGroupsStr, activitySinceStr, activityUntilStr); err != nil {
		return nil, err
	}

	return config, nil
}

func (c *Config) validate() error {
	if c.GitType == "" {
		return fmt.Errorf("--git-type is required")
	}

	if c.GitType != "GitHub" && c.GitType != "GitLab" {
		return fmt.Errorf("invalid git-type: %s. Must be 'GitHub' or 'GitLab'", c.GitType)
	}

	if c.FileOutput == "" {
		return fmt.Errorf("--file-output is required")
	}

	// Validate GitLab specific requirements
	if c.GitType == "GitLab" && c.URL == "" {
		return fmt.Errorf("--url is required for GitLab")
	}

	// Validate GitHub specific requirements
	if c.GitType == "GitHub" && c.Organization == "" {
		return fmt.Errorf("--organization is required for GitHub")
	}

	return nil
}

func (c *Config) parseOptionalFields(groupStr, ignoreReposStr, ignoreGroupsStr, activitySinceStr, activityUntilStr string) error {
	if groupStr != "" {
		group, err := strconv.Atoi(groupStr)
		if err != nil {
			return fmt.Errorf("invalid group id: %s", groupStr)
		}
		c.Group = &group
	}

	if ignoreReposStr != "" {
		repos, err := parseIntListAsInt64(ignoreReposStr)
		if err != nil {
			return fmt.Errorf("invalid repo ids in ignore-repos: %w", err)
		}
		c.IgnoreRepos = repos
	}

	if ignoreGroupsStr != "" {
		groups, err := parseIntListAsInt(ignoreGroupsStr)
		if err != nil {
			return fmt.Errorf("invalid group ids in ignore-groups: %w", err)
		}
		c.IgnoreGroups = groups
	}

	if activitySinceStr != "" {
		d, err := duration.Parse(activitySinceStr)
		if err != nil {
			return fmt.Errorf("invalid activity-since-duration: %w", err)
		}
		c.ActivitySinceDuration = &d
	}

	if activityUntilStr != "" {
		d, err := duration.Parse(activityUntilStr)
		if err != nil {
			return fmt.Errorf("invalid activity-until-duration: %w", err)
		}
		c.ActivityUntilDuration = &d
	}

	return nil
}

func parseIntListAsInt64(s string) ([]int64, error) {
	var result []int64
	parts := strings.SplitSeq(s, ",")

	for part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}

		id, err := strconv.ParseInt(part, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid id: %s", part)
		}
		result = append(result, id)
	}

	return result, nil
}

func parseIntListAsInt(s string) ([]int, error) {
	var result []int
	parts := strings.SplitSeq(s, ",")

	for part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}

		id, err := strconv.Atoi(part)
		if err != nil {
			return nil, fmt.Errorf("invalid id: %s", part)
		}
		result = append(result, id)
	}

	return result, nil
}

// GetTimeFrame returns the start and end times based on duration configuration
func (c *Config) GetTimeFrame() (*time.Time, *time.Time, error) {
	if c.ActivitySinceDuration == nil && c.ActivityUntilDuration == nil {
		return nil, nil, nil
	}

	now := time.Now().UTC()
	var startTime, endTime *time.Time

	if c.ActivitySinceDuration != nil {
		t := now.Add(-*c.ActivitySinceDuration)
		startTime = &t
	}

	if c.ActivityUntilDuration != nil {
		t := now.Add(-*c.ActivityUntilDuration)
		endTime = &t
	}

	if startTime != nil && endTime != nil && startTime.After(*endTime) {
		return nil, nil, fmt.Errorf("activity-since-duration must be greater than activity-until-duration")
	}

	return startTime, endTime, nil
}
