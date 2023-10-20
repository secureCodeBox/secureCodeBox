// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package aws

import (
	"encoding/json"

	awssdk "github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/ecs"
	"github.com/go-logr/logr"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/pkg/kubernetes"
)

type EcsTaskStateChange struct {
	Source     string   `json:"source"`
	DetailType string   `json:"detail-type"`
	Detail     ecs.Task `json:"detail"`
}

func handleEcsEvent(rawMessage string, log logr.Logger) ([]kubernetes.Request, error) {
	var stateChange EcsTaskStateChange
	err := json.Unmarshal([]byte(rawMessage), &stateChange)

	if err != nil {
		return nil, err
	}

	// containerInfos is only built and used for logging
	containerInfos := make([]struct {
		Image  string
		Status string
	}, len(stateChange.Detail.Containers))

	requests := make([]kubernetes.Request, len(stateChange.Detail.Containers))
	for idx, container := range stateChange.Detail.Containers {
		reference := *container.Image
		if container.ImageDigest == nil {
			container.ImageDigest = awssdk.String("")
		} else {
			reference = reference + "@" + *container.ImageDigest
		}

		// All this only for logging the information
		containerInfos[idx] = struct {
			Image  string
			Status string
		}{Image: reference, Status: *container.LastStatus}

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

	log.V(1).Info("Received ECS State Change", "containers", containerInfos)

	return requests, nil
}
