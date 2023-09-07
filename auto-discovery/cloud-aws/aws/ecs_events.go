// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package aws

import (
	"encoding/json"
	"fmt"

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
	LastStatus  string `json:"lastStatus"`
	Name        string `json:"name"`
	Image       string `json:"image"`
	ImageDigest string `json:"imageDigest"`
}

func handleEcsEvent(rawMessage string) ([]kubernetes.Request, error) {
	//fmt.Println("Handling raw event", *rawMessage)
	var stateChange EcsTaskStateChange
	err := json.Unmarshal([]byte(rawMessage), &stateChange)
	//fmt.Printf("parsed: %+v\n", stateChange)

	if err != nil {
		return nil, err
	}

	switch stateChange.Detail.LastStatus {
	case "RUNNING":
		fmt.Println("Handling container event:", stateChange.Detail.LastStatus)

		// get unique values by adding them to a "set"
		requestSet := make(map[kubernetes.Request]struct{}, len(stateChange.Detail.Containers))
		for _, container := range stateChange.Detail.Containers {
			fmt.Println("Container is now running:", container.Image, container.ImageDigest)
			requestSet[kubernetes.Request{Image: container.Image, ImageDigest: container.ImageDigest}] = struct{}{}
		}

		requests := make([]kubernetes.Request, len(requestSet))
		i := 0
		for k := range requestSet {
			requests[i] = k
			i++
		}

		return requests, nil
	default:
		fmt.Println("Ignoring container event:", stateChange.Detail.LastStatus)
		return nil, nil
	}
}
