// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package aws

import (
	"encoding/json"

	awssdk "github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/ecs"
	dockerparser "github.com/novln/docker-parser"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/pkg/kubernetes"
)

type EcsTaskStateChange struct {
	Source     string   `json:"source"`
	DetailType string   `json:"detail-type"`
	Detail     ecs.Task `json:"detail"`
}

func handleEcsEvent(rawMessage string) ([]kubernetes.Request, error) {
	var stateChange EcsTaskStateChange
	err := json.Unmarshal([]byte(rawMessage), &stateChange)

	if err != nil {
		return nil, err
	}

	requests := make([]kubernetes.Request, len(stateChange.Detail.Containers))
	for idx, container := range stateChange.Detail.Containers {
		name := *container.Image

		// To prevent misdetection of containers using the same digest but different tags (i.e. none
		// and latest or 22.04 and jammy), remove the tag from the image if we have a digest so that
		// these images will occupy the same spot in the "set"
		// Technically we could also take a tag from the image reference if it includes one, but all
		// the libraries to work with image references don't allow accessing that properly
		if container.ImageDigest != nil && *container.ImageDigest != "" {
			reference, err := dockerparser.Parse(*container.Image)
			if err != nil {
				return nil, err
			}

			name = reference.Repository()
		} else {
			container.ImageDigest = awssdk.String("")
		}

		requests[idx] = kubernetes.Request{
			State: *container.LastStatus,
			Container: kubernetes.ContainerInfo{
				Id: *container.ContainerArn,
				Image: kubernetes.ImageInfo{
					Name:   name,
					Digest: *container.ImageDigest,
				},
			},
		}
	}

	return requests, nil
}
