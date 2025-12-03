// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package duration

import (
	"testing"
	"time"
)

func TestParse(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected time.Duration
		wantErr  bool
	}{
		{
			name:     "standard_seconds",
			input:    "30s",
			expected: 30 * time.Second,
			wantErr:  false,
		},
		{
			name:     "standard_minutes",
			input:    "15m",
			expected: 15 * time.Minute,
			wantErr:  false,
		},
		{
			name:     "standard_hours",
			input:    "2h",
			expected: 2 * time.Hour,
			wantErr:  false,
		},
		{
			name:     "standard_combined",
			input:    "1h30m",
			expected: 90 * time.Minute,
			wantErr:  false,
		},
		{
			name:     "custom_days",
			input:    "7d",
			expected: 7 * 24 * time.Hour,
			wantErr:  false,
		},
		{
			name:     "custom_weeks",
			input:    "2w",
			expected: 14 * 24 * time.Hour,
			wantErr:  false,
		},
		{
			name:     "custom_months",
			input:    "1mo",
			expected: 30 * 24 * time.Hour,
			wantErr:  false,
		},
		{
			name:     "custom_years",
			input:    "1y",
			expected: 365 * 24 * time.Hour,
			wantErr:  false,
		},
		{
			name:     "decimal_days",
			input:    "1.5d",
			expected: 36 * time.Hour,
			wantErr:  false,
		},
		{
			name:     "decimal_weeks",
			input:    "0.5w",
			expected: 84 * time.Hour,
			wantErr:  false,
		},
		{
			name:     "uppercase_days",
			input:    "7D",
			expected: 7 * 24 * time.Hour,
			wantErr:  false,
		},
		{
			name:     "uppercase_months",
			input:    "2MO",
			expected: 60 * 24 * time.Hour,
			wantErr:  false,
		},
		{
			name:     "invalid_format",
			input:    "invalid",
			expected: 0,
			wantErr:  true,
		},
		{
			name:     "empty_string",
			input:    "",
			expected: 0,
			wantErr:  true,
		},
		{
			name:     "number_only",
			input:    "42",
			expected: 0,
			wantErr:  true,
		},
		{
			name:     "invalid_suffix",
			input:    "7x",
			expected: 0,
			wantErr:  true,
		},
		{
			name:     "non_numeric_prefix",
			input:    "abcd",
			expected: 0,
			wantErr:  true,
		},
		{
			name:     "mixed_invalid",
			input:    "1d2w", // Not supported format
			expected: 0,
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Parse(tt.input)

			if tt.wantErr {
				if err == nil {
					t.Errorf("Parse(%q) expected error, got nil", tt.input)
				}
			} else {
				if err != nil {
					t.Errorf("Parse(%q) unexpected error: %v", tt.input, err)
				}
				if got != tt.expected {
					t.Errorf("Parse(%q) = %v, want %v", tt.input, got, tt.expected)
				}
			}
		})
	}
}
