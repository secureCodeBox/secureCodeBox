// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package kubernetes

import (
	"strings"

	dockerparser "github.com/novln/docker-parser"
)

// Store information about docker image references
type ImageInfo struct {
	Name   string
	Digest string
	parsed *dockerparser.Reference
}

// Use dockerparser to normalize the image reference and allow easy access to the properties
func (image *ImageInfo) normalize() error {
	// To prevent misdetection of containers using the same digest but different tags (i.e. none
	// and latest or 22.04 and jammy), remove the tag from the image if we have a digest so that
	// these images will occupy the same spot in the "set"
	parsed, err := dockerparser.Parse(image.Name)
	if err != nil {
		return err
	}

	// Store the result for later
	image.parsed = parsed

	return nil
}

// Get a short, representative name for the image
func (image *ImageInfo) appName() string {
	// If the image is parsed or parsing works use library function
	if image.parsed != nil || image.normalize() == nil {
		return image.parsed.ShortName()
	}

	// Parsing failed, try to salvage this somehow by returning what we have
	name := image.Name

	// If name contains a port, domain or localhost remove that
	split := strings.Split(name, "/")
	if strings.Contains(split[0], ":") || strings.Contains(split[0], ".") || split[0] == "localhost" {
		name = strings.Join(split[1:], "")
	}

	// Remove tag or digest
	if strings.Contains(name, ":") {
		return strings.Split(name, ":")[0]
	} else if strings.Contains(name, "@") {
		return strings.Split(name, "@")[0]
	} else {
		return name
	}
}

// Get an identifier for the version of the app, either a tag if available or the digest
func (image *ImageInfo) version() string {
	// If the image is parsed or parsing works use library function
	if image.parsed != nil || image.normalize() == nil {
		return image.parsed.Tag()
	}

	// Parsing failed, try to salvage this somehow by returning what we have
	// Check if we have a tag by getting the last component of the reference and checking for :
	split := strings.Split(image.Name, "/")
	last := split[len(split)-1]
	if strings.Contains(last, ":") {
		split = strings.Split(last, ":")
		return split[len(split)-1]
	} else if strings.Contains(last, "@") {
		split = strings.Split(last, "@")
		return split[len(split)-1]
	} else {
		return "latest"
	}
}

// Get the digest without prefix
func (image *ImageInfo) hash() string {
	digest := image.Digest
	// Try to use a digest from the reference if there is one and the separate one is empty
	if image.Digest == "" {
		// If the image is parsed or parsing works use library function
		if image.parsed != nil || image.normalize() == nil {
			// The library stores digest and tag in the same way, wonderfully convenient
			maybeDigest := image.parsed.Tag()
			if strings.Contains(maybeDigest, ":") {
				digest = maybeDigest
			}
		} else {
			split := strings.Split(image.Name, "@")
			digest = split[len(split)-1]
		}
	}

	split := strings.Split(digest, ":")
	return split[len(split)-1]
}

// Get a complete and unique reference to this docker image
func (image *ImageInfo) reference() string {
	// If the image is parsed or parsing works use library function
	if image.parsed != nil || image.normalize() == nil {
		if image.Digest == "" {
			return image.parsed.Remote()
		} else {
			return image.parsed.Repository() + "@" + image.Digest
		}
	}

	// Parsing failed, try to salvage this somehow by returning what we have
	if image.Digest == "" {
		return image.Name
	} else {
		return image.Name + "@" + image.Digest
	}
}
