// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package duration

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

var durationMultipliers = map[string]time.Duration{
	"s":  time.Second,
	"m":  time.Minute,
	"h":  time.Hour,
	"d":  24 * time.Hour,
	"w":  7 * 24 * time.Hour,
	"mo": 30 * 24 * time.Hour,
	"y":  365 * 24 * time.Hour,
}

// parseDuration parses duration strings like "7d", "2w", "1h30m"
func Parse(s string) (time.Duration, error) {
	// First try standard Go duration parsing
	if d, err := time.ParseDuration(s); err == nil {
		return d, nil
	}

	// Handle common suffixes
	s = strings.ToLower(strings.TrimSpace(s))

	multipliers := map[string]time.Duration{
		"s":  time.Second,
		"m":  time.Minute,
		"h":  time.Hour,
		"d":  24 * time.Hour,
		"w":  7 * 24 * time.Hour,
		"mo": 30 * 24 * time.Hour,
		"y":  365 * 24 * time.Hour,
	}

	// Try to parse with custom suffixes
	for suffix, multiplier := range multipliers {
		if strings.HasSuffix(s, suffix) {
			numStr := strings.TrimSuffix(s, suffix)
			num, err := strconv.ParseFloat(numStr, 64)
			if err != nil {
				continue
			}
			return time.Duration(float64(multiplier) * num), nil
		}
	}

	return 0, fmt.Errorf("unable to parse duration: %s", s)
}
