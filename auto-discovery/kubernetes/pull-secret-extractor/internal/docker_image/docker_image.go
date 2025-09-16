// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package docker_image

import (
	"strings"
)

const (
	legacyDefaultDomain = "index.docker.io"
	defaultDomain       = "docker.io"
	officialRepoName    = "library"
	defaultTag          = "latest"
)

// GetDomainFromDockerImage extracts domain from a given docker image.
// Has the same defaulting behavior when it comes to docker.io image as containerd.
// Code adapted from https://github.com/containerd/containerd/blob/20de989afcd2fd4edc20e9b85312e49a8bbe152b/reference/docker/normalize.go#L102-L119
func GetDomainFromDockerImage(name string) string {
	i := strings.Index(name, "/")

	var domain string

	if i == -1 {
		domain = defaultDomain
	} else {
		nameSlice := name[:i]

		if !strings.Contains(nameSlice, ":") &&
			!strings.Contains(nameSlice, ".") &&
			nameSlice != "localhost" &&
			strings.ToLower(nameSlice) == nameSlice {
			domain = defaultDomain
		} else {
			domain = nameSlice
		}
	}

	if domain == legacyDefaultDomain {
		domain = defaultDomain
	}

	return domain
}
