// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package config

import (
	"strings"
	"testing"
	"time"
)

func TestConfig_Validate(t *testing.T) {
	tests := []struct {
		name    string
		config  Config
		wantErr bool
		errMsg  string
	}{
		{
			name:    "missing git-type",
			config:  Config{FileOutput: "output.json"},
			wantErr: true,
			errMsg:  "--git-type is required",
		},
		{
			name:    "invalid git-type",
			config:  Config{GitType: "Bitbucket", FileOutput: "output.json"},
			wantErr: true,
			errMsg:  "invalid git-type",
		},
		{
			name:    "GitLab missing URL",
			config:  Config{GitType: "GitLab", FileOutput: "output.json"},
			wantErr: true,
			errMsg:  "--url is required for GitLab",
		},
		{
			name:    "GitHub missing organization",
			config:  Config{GitType: "GitHub", FileOutput: "output.json"},
			wantErr: true,
			errMsg:  "--organization is required for GitHub",
		},
		{
			name: "valid GitHub config",
			config: Config{
				GitType:      "GitHub",
				FileOutput:   "output.json",
				Organization: "test-org",
			},
			wantErr: false,
		},
		{
			name: "valid GitLab config",
			config: Config{
				GitType:    "GitLab",
				FileOutput: "output.json",
				URL:        "https://gitlab.com",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.config.validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("validate() error = %v, wantErr %v", err, tt.wantErr)
			}
			if err != nil && tt.errMsg != "" && !strings.Contains(err.Error(), tt.errMsg) {
				t.Errorf("error message = %v, want to contain %v", err.Error(), tt.errMsg)
			}
		})
	}
}

func TestConfig_ParseOptionalFields(t *testing.T) {
	tests := []struct {
		name             string
		groupStr         string
		ignoreReposStr   string
		ignoreGroupsStr  string
		activitySinceStr string
		activityUntilStr string
		wantErr          bool
		validateResult   func(t *testing.T, c *Config)
	}{
		{
			name:     "valid group ID",
			groupStr: "123",
			wantErr:  false,
			validateResult: func(t *testing.T, c *Config) {
				if c.Group == nil || *c.Group != 123 {
					t.Errorf("expected group to be 123, got %v", c.Group)
				}
			},
		},
		{
			name:     "invalid group ID",
			groupStr: "abc",
			wantErr:  true,
		},
		{
			name:           "valid ignore repos list",
			ignoreReposStr: "1,2,3,456",
			wantErr:        false,
			validateResult: func(t *testing.T, c *Config) {
				expected := []int64{1, 2, 3, 456}
				if len(c.IgnoreRepos) != len(expected) {
					t.Errorf("expected %d repos, got %d", len(expected), len(c.IgnoreRepos))
				}
				for i, v := range expected {
					if c.IgnoreRepos[i] != v {
						t.Errorf("repo[%d]: expected %d, got %d", i, v, c.IgnoreRepos[i])
					}
				}
			},
		},
		{
			name:           "ignore repos with spaces",
			ignoreReposStr: " 1 , 2 , 3 ",
			wantErr:        false,
			validateResult: func(t *testing.T, c *Config) {
				if len(c.IgnoreRepos) != 3 {
					t.Errorf("expected 3 repos, got %d", len(c.IgnoreRepos))
				}
			},
		},
		{
			name:           "invalid ignore repos",
			ignoreReposStr: "1,abc,3",
			wantErr:        true,
		},
		{
			name:             "valid activity durations",
			activitySinceStr: "7d",
			activityUntilStr: "1d",
			wantErr:          false,
			validateResult: func(t *testing.T, c *Config) {
				if c.ActivitySinceDuration == nil {
					t.Error("ActivitySinceDuration should not be nil")
				}
				if c.ActivityUntilDuration == nil {
					t.Error("ActivityUntilDuration should not be nil")
				}
			},
		},
		{
			name:             "invalid activity-since duration",
			activitySinceStr: "invalid",
			wantErr:          true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := &Config{}
			err := c.parseOptionalFields(tt.groupStr, tt.ignoreReposStr, tt.ignoreGroupsStr,
				tt.activitySinceStr, tt.activityUntilStr)

			if (err != nil) != tt.wantErr {
				t.Errorf("parseOptionalFields() error = %v, wantErr %v", err, tt.wantErr)
			}

			if !tt.wantErr && tt.validateResult != nil {
				tt.validateResult(t, c)
			}
		})
	}
}

func TestConfig_GetTimeFrame(t *testing.T) {
	sevenDays := 7 * 24 * time.Hour
	oneDay := 24 * time.Hour

	tests := []struct {
		name                  string
		activitySinceDuration *time.Duration
		activityUntilDuration *time.Duration
		wantErr               bool
		errMsg                string
	}{
		{
			name:    "no durations returns nil",
			wantErr: false,
		},
		{
			name:                  "valid range: 7 days since, 1 day until",
			activitySinceDuration: &sevenDays,
			activityUntilDuration: &oneDay,
			wantErr:               false,
		},
		{
			name:                  "invalid range: since < until",
			activitySinceDuration: &oneDay,
			activityUntilDuration: &sevenDays,
			wantErr:               true,
			errMsg:                "activity-since-duration must be greater than activity-until-duration",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := &Config{
				ActivitySinceDuration: tt.activitySinceDuration,
				ActivityUntilDuration: tt.activityUntilDuration,
			}

			start, end, err := c.GetTimeFrame()

			if (err != nil) != tt.wantErr {
				t.Errorf("GetTimeFrame() error = %v, wantErr %v", err, tt.wantErr)
			}

			if err != nil && tt.errMsg != "" && !strings.Contains(err.Error(), tt.errMsg) {
				t.Errorf("error message = %v, want to contain %v", err.Error(), tt.errMsg)
			}

			// Basic validation of the logic
			if err == nil {
				if tt.activitySinceDuration == nil && tt.activityUntilDuration == nil {
					if start != nil || end != nil {
						t.Error("expected both start and end to be nil when no durations set")
					}
				}
				if start != nil && end != nil && start.After(*end) {
					t.Error("start time should be before end time")
				}
			}
		})
	}
}
