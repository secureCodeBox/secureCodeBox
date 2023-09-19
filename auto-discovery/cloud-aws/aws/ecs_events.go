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

	switch state := stateChange.Detail.LastStatus; state {
	case "RUNNING":
		fmt.Println("Handling container event:", state)

		requests := getContainerRequests(stateChange.Detail.Containers, "added")

		return requests, nil
	case "STOPPED":
		fmt.Println("Handling container event:", state)

		requests := getContainerRequests(stateChange.Detail.Containers, "removed")

		return requests, nil
	default:
		fmt.Println("Ignoring container event:", state)
		return nil, nil
	}
}

func getContainerRequests(containers []EcsContainerInfo, action string) []kubernetes.Request {
	// TODO this ignores the individual container status and picks up the status of the whole Task
	// this works, but is not as fine grained as could be and adds some unnecessary scans
	// the problem with looking at the lastStatus of containers directly is that very short lived
	// containers will never show up with a status "RUNNING", they immediately switch to "STOPPED"

	// get unique values by adding them to a "set"
	requestSet := make(map[kubernetes.Request]struct{}, len(containers))
	for _, container := range containers {
		fmt.Println("Container is now running:", container.Image, container.ImageDigest)
		requestSet[kubernetes.Request{
			Action:      action,
			Image:       container.Image,
			ImageDigest: container.ImageDigest,
		}] = struct{}{}
	}

	requests := make([]kubernetes.Request, len(requestSet))
	i := 0
	for k := range requestSet {
		requests[i] = k
		i++
	}

	return requests
}
