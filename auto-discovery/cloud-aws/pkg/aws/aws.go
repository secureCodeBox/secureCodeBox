// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package aws

import (
	"context"
	"time"

	awssdk "github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/request"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/go-logr/logr"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/pkg/config"
	"github.com/secureCodeBox/secureCodeBox/auto-discovery/cloud-aws/pkg/kubernetes"
)

// An interface for the APIs needed from the AWS SDK so that it can be mocked in tests
type SQSAPI interface {
	ReceiveMessage(input *sqs.ReceiveMessageInput) (*sqs.ReceiveMessageOutput, error)
	ReceiveMessageWithContext(ctx awssdk.Context, input *sqs.ReceiveMessageInput, opts ...request.Option) (*sqs.ReceiveMessageOutput, error)
	DeleteMessage(input *sqs.DeleteMessageInput) (*sqs.DeleteMessageOutput, error)
	DeleteMessageWithContext(ctx awssdk.Context, input *sqs.DeleteMessageInput, opts ...request.Option) (*sqs.DeleteMessageOutput, error)
}

// Monitors changes in AWS to create kubernetes.Request for each changed container instance
type MonitorService struct {
	Config     *config.AutoDiscoveryConfig
	SqsService SQSAPI
	Reconciler kubernetes.CloudReconciler
	Log        logr.Logger
}

// Create a MonitorService with a new AWS session
func NewMonitorService(cfg *config.AutoDiscoveryConfig, reconciler kubernetes.CloudReconciler, log logr.Logger) *MonitorService {
	session := getSession(log)
	service := sqs.New(session)

	return NewMonitorServiceWith(cfg, service, reconciler, log)
}

// Create a MonitorService with a provided SQS service connection
func NewMonitorServiceWith(cfg *config.AutoDiscoveryConfig, service SQSAPI, reconciler kubernetes.CloudReconciler, log logr.Logger) *MonitorService {
	return &MonitorService{
		Config:     cfg,
		SqsService: service,
		Reconciler: reconciler,
		Log:        log,
	}
}

// Run the MonitorService and continuously check for changes in AWS
func (m *MonitorService) Run(ctx context.Context) {
	m.Log.Info("Receiving messages...")
	for {
		select {
		case <-ctx.Done():
			return
		default:
			msgResult, err := m.pollQueue(ctx)

			if err != nil {
				// ignore context errors
				if ctx.Err() == nil {
					m.Log.Error(err, "Error fetching AWS messages")
					// cheap cooldown after api error
					m.Log.Info("sleeping")
					time.Sleep(10 * time.Second)
				}
			} else if len(msgResult.Messages) > 0 {
				for _, message := range msgResult.Messages {

					// Get the kubernetes.Requests for the message, depending on the type
					requests, err := m.handleEvent(*message.Body)
					if err != nil {
						m.Log.Error(err, "Error handling AWS event")
						continue
					}

					errors := false
					if len(requests) > 0 {
						for _, request := range requests {
							err = m.Reconciler.Reconcile(ctx, request)
							if err != nil {
								m.Log.Error(err, "Unable to reconcile request")
								errors = true
							}
						}
					}

					if !errors {
						// delete message from the service
						// if there was a kubernetes error the message will be kept and tried again
						// this might forever retry the same message or messages
						m.deleteMessageFromQueue(ctx, message.ReceiptHandle)
					}
				}
			}
		}
	}
}

func (m *MonitorService) pollQueue(ctx context.Context) (*sqs.ReceiveMessageOutput, error) {
	return m.SqsService.ReceiveMessageWithContext(ctx, &sqs.ReceiveMessageInput{
		AttributeNames: []*string{
			awssdk.String(sqs.MessageSystemAttributeNameSentTimestamp),
		},
		MessageAttributeNames: []*string{
			awssdk.String(sqs.QueueAttributeNameAll),
		},
		QueueUrl:            &m.Config.Aws.QueueUrl,
		MaxNumberOfMessages: awssdk.Int64(1),
		VisibilityTimeout:   awssdk.Int64(20),
		WaitTimeSeconds:     awssdk.Int64(20),
	})
}

func (m *MonitorService) deleteMessageFromQueue(ctx context.Context, receiptHandle *string) error {
	_, err := m.SqsService.DeleteMessageWithContext(ctx, &sqs.DeleteMessageInput{
		QueueUrl:      &m.Config.Aws.QueueUrl,
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
