// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package aws

import (
	"encoding/json"

	awssdk "github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/ecs"
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
		if container.ImageDigest == nil {
			container.ImageDigest = awssdk.String("")
		}

		requests[idx] = kubernetes.Request{
			State: *container.LastStatus,
			Container: kubernetes.ContainerInfo{
				Id: *container.ContainerArn,
				Image: kubernetes.ImageInfo{
					Name:   *container.Image,
					Digest: *container.ImageDigest,
				},
			},
		}
	}

	return requests, nil
}
