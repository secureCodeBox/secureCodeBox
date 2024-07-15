// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	"context"
	"errors"
	"testing"

	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"github.com/stretchr/testify/assert"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

type TestClientProvider struct {
	client.Client
	namespace string
	err       error
}

func (m *TestClientProvider) GetClient(_ *genericclioptions.ConfigFlags) (client.Client, string, error) {
	return m.Client, m.namespace, m.err
}

type triggerTestcase struct {
	name          string
	args          []string
	namespace     string
	expectedError error
	setup         func(client.Client)
}

func TestTriggerCommand(t *testing.T) {
	testcases := []triggerTestcase{
		{
			name:      "Should trigger a scheduled scan successfully",
			args:      []string{"trigger", "nmap"},
			namespace: "default",
			expectedError: nil,
			setup: func(client client.Client) {
				scan := &v1.ScheduledScan{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "nmap",
						Namespace: "default",
					},
				}
				client.Create(context.Background(), scan)
			},
		},
		{
			name:          "Should return error if scheduled scan not found",
			args:          []string{"trigger", "nonexistent-scan"},
			namespace:     "default",
			expectedError: errors.New("could not find ScheduledScan 'nonexistent-scan' in namespace 'default'"),
			setup:         func(client.Client) {},
		},
		{
			name:          "Should return error if no scan name is provided",
			args:          []string{"trigger"},
			namespace:     "default",
			expectedError: errors.New("requires at least 1 arg(s), only received 0"),
			setup:         func(client.Client) {},
		},
		{
			name:      "Should trigger a scheduled scan in a custom namespace",
			args:      []string{"trigger", "nmap", "--namespace", "foobar"},
			namespace: "custom-namespace",
			expectedError: nil,
			setup: func(client client.Client) {
				scan := &v1.ScheduledScan{
					ObjectMeta: metav1.ObjectMeta{
						Name:      "nmap",
						Namespace: "foobar",
					},
				}
				client.Create(context.Background(), scan)
			},
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			scheme := runtime.NewScheme()
			utilruntime.Must(v1.AddToScheme(scheme))
			client := fake.NewClientBuilder().WithScheme(scheme).Build()
			clientProvider = &TestClientProvider{
				Client:    client,
				namespace: tc.namespace,
				err:       nil,
			}

			if tc.setup != nil {
				tc.setup(client)
			}

			rootCmd := NewRootCommand()

			rootCmd.SetArgs(tc.args)
			rootCmd.SilenceUsage = true

			err := rootCmd.Execute()

			if tc.expectedError != nil {
				assert.Equal(t, tc.expectedError.Error(), err.Error())
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
