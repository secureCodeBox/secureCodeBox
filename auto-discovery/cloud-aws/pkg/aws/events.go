// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package aws

import (
	"encoding/json"
	"errors"

	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/pkg/kubernetes"
)

type EventMessage struct {
	Source     string `json:"source"`
	DetailType string `json:"detail-type"`
}

// Unmarshal the message body into the correct type, depending on the source and create kubernetes.Requests for it
func (m *MonitorService) handleEvent(rawMessage string) ([]kubernetes.Request, error) {
	var message EventMessage
	err := json.Unmarshal([]byte(rawMessage), &message)
	if err != nil {
		return nil, err
	}

	m.Log.V(1).Info("Message received, handling according to DetailType", "DetailType", message.DetailType)

	switch message.DetailType {
	case "ECS Task State Change":
		return handleEcsEvent(rawMessage, m.Log)
	default:
		return nil, errors.New("Unexpected detail-type " + message.DetailType + " from source " + message.Source)
	}
}
