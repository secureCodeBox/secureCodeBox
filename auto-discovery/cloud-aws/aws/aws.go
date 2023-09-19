// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package aws

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/kubernetes"
)

type MonitorService struct {
	Queue      string
	Session    *session.Session
	SqsService *sqs.SQS
	Reconciler kubernetes.AWSReconciler
	Ticker     *time.Ticker
}

func NewMonitorService(queue string, reconciler kubernetes.AWSReconciler) *MonitorService {
	session := getSession()
	service := sqs.New(session)

	return &MonitorService{
		Queue:      queue,
		Session:    session,
		SqsService: service,
		Reconciler: reconciler,
		Ticker:     nil,
	}
}

func (m *MonitorService) Run() {
	m.Ticker = time.NewTicker(5 * time.Second)

	fmt.Println("Receiving messages...")
	for range m.Ticker.C {
		//fmt.Println("Tick at", t, ", polling queue...")
		msgResult, err := m.pollQueue()

		if err != nil {
			fmt.Println(err)
		} else if len(msgResult.Messages) > 0 {
			for _, message := range msgResult.Messages {
				fmt.Println("Message received:")
				//fmt.Println(*message.Body)

				requests, err := handleEvent(*message.Body)

				if err != nil {
					fmt.Println(err)
					continue
				}

				allErrs := make([]error, 0)
				if len(requests) > 0 {
					for _, request := range requests {
						err = m.Reconciler.Reconcile(context.Background(), request)
						if err != nil {
							allErrs = append(allErrs, err)
						}
					}
				}

				if len(allErrs) == 0 {
					// delete message from the service
					m.deleteMessageFromQueue(message.ReceiptHandle)
				} else {
					// keep message in queue and try to handle it again
					fmt.Printf("Errors while registering scan: %v\n", allErrs)
				}
			}
		} /*else {
			fmt.Println("Queue is empty, nothing to do.")
		}*/
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

func getSession() *session.Session {
	fmt.Println("Connecting to AWS...")
	return session.Must(session.NewSessionWithOptions(session.Options{
		SharedConfigState: session.SharedConfigEnable,
	}))
}
