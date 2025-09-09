// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package docker_image

import "testing"

func TestGetDomainFromDockerImage(t *testing.T) {
	testCases := []struct {
		name     string
		image    string
		expected string
	}{
		{
			name:     "image with no domain",
			image:    "foo/bar",
			expected: "docker.io",
		},
		{
			name:     "image with docker.io domain",
			image:    "docker.io/foo/bar",
			expected: "docker.io",
		},
		{
			name:     "image with non-docker.io domain",
			image:    "test.xyz/foo/bar",
			expected: "test.xyz",
		},
		{
			name:     "single word image",
			image:    "ubuntu",
			expected: "docker.io",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := GetDomainFromDockerImage(tc.image)
			if result != tc.expected {
				t.Errorf("GetDomainFromDockerImage(%q) = %q; want %q", tc.image, result, tc.expected)
			}
		})
	}
}
