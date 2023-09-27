// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package aws

import (
	"context"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/go-logr/logr"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/kubernetes"
)

type MonitorService struct {
	Queue      string
	Session    *session.Session
	SqsService *sqs.SQS
	Reconciler kubernetes.AWSReconciler
	Log        logr.Logger
}

func NewMonitorService(queue string, reconciler kubernetes.AWSReconciler, log logr.Logger) *MonitorService {
	session := getSession(log)
	service := sqs.New(session)

	return &MonitorService{
		Queue:      queue,
		Session:    session,
		SqsService: service,
		Reconciler: reconciler,
		Log:        log,
	}
}

func (m *MonitorService) Run() {
	m.Log.Info("Receiving messages...")
	for {
		msgResult, err := m.pollQueue()

		if err != nil {
			m.Log.Error(err, "Error fetching AWS messages")
			time.Sleep(10 * time.Second)
		} else if len(msgResult.Messages) > 0 {
			for _, message := range msgResult.Messages {

				requests, err := m.handleEvent(*message.Body)
				if err != nil {
					m.Log.Error(err, "Error handling AWS event")
					continue
				}

				errors := false
				if len(requests) > 0 {
					for _, request := range requests {
						err = m.Reconciler.Reconcile(context.Background(), request)
						if err != nil {
							m.Log.Error(err, "Unable to reconcile request")
							errors = true
						}
					}
				}

				if !errors {
					// delete message from the service
					// otherwise keep message in queue and try to handle it again?
					// TODO need better way to handle errors
					m.deleteMessageFromQueue(message.ReceiptHandle)
				}
			}
		}
	}
}

func (m *MonitorService) pollQueue() (*sqs.ReceiveMessageOutput, error) {
	return m.SqsService.ReceiveMessage(&sqs.ReceiveMessageInput{
		AttributeNames: []*string{
			aws.String(sqs.MessageSystemAttributeNameSentTimestamp),
		},
		MessageAttributeNames: []*string{
			aws.String(sqs.QueueAttributeNameAll),
		},
		QueueUrl:            &m.Queue,
		MaxNumberOfMessages: aws.Int64(1),
		VisibilityTimeout:   aws.Int64(20),
		WaitTimeSeconds:     aws.Int64(20),
	})
}

func (m *MonitorService) deleteMessageFromQueue(receiptHandle *string) error {
	_, err := m.SqsService.DeleteMessage(&sqs.DeleteMessageInput{
		QueueUrl:      &m.Queue,
		ReceiptHandle: receiptHandle,
	})

	if err != nil {
		return err
	}

	return nil
}

func getSession(log logr.Logger) *session.Session {
	log.Info("Connecting to AWS...")
	return session.Must(session.NewSessionWithOptions(session.Options{
		SharedConfigState: session.SharedConfigEnable,
	}))
}
