// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package aws

import (
	"encoding/json"

	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/kubernetes"
)

type EcsTaskStateChange struct {
	Source string         `json:"source"`
	Detail EcsStateDetail `json:"detail"`
}

type EcsStateDetail struct {
	Containers []EcsContainerInfo `json:"containers"`
	LastStatus string             `json:"lastStatus"`
}

type EcsContainerInfo struct {
	ContainerArn string `json:"containerArn"`
	LastStatus   string `json:"lastStatus"`
	Name         string `json:"name"`
	Image        string `json:"image"`
	ImageDigest  string `json:"imageDigest"`
}

func handleEcsEvent(rawMessage string) ([]kubernetes.Request, error) {
	//fmt.Println("Handling raw event", *rawMessage)
	var stateChange EcsTaskStateChange
	err := json.Unmarshal([]byte(rawMessage), &stateChange)
	//fmt.Printf("parsed: %+v\n", stateChange)

	if err != nil {
		return nil, err
	}

	requests := make([]kubernetes.Request, len(stateChange.Detail.Containers))
	for idx, container := range stateChange.Detail.Containers {
		requests[idx] = kubernetes.Request{
			State: container.LastStatus,
			Container: kubernetes.ContainerInfo{
				Id: container.ContainerArn,
				Image: kubernetes.ImageInfo{
					// TODO if the image is used sometimes with and sometimes without a tag the
					// "set" treats them like different entries
					Name:   container.Image,
					Digest: container.ImageDigest,
				},
			},
		}
	}

	return requests, nil
}
