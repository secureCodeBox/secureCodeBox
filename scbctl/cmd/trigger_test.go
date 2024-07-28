// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	"context"
	"errors"
	"testing"

	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"github.com/spf13/cobra"
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
			name:          "Should trigger a scheduled scan successfully",
			args:          []string{"trigger", "nmap"},
			namespace:     "foobar",
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
		{
			name:          "Should return error if scheduled scan not found",
			args:          []string{"trigger", "nonexistent-scan"},
			namespace:     "foobar",
			expectedError: errors.New("could not find ScheduledScan 'nonexistent-scan' in namespace 'foobar'"),
			setup:         func(client.Client) {},
		},
		{
			name:          "Should return error if no scan name is provided",
			args:          []string{"trigger"},
			namespace:     "default",
			expectedError: errors.New("accepts 1 arg(s), received 0"),
			setup:         func(client.Client) {},
		},
		{
			name:          "Should trigger a scheduled scan in a custom namespace",
			args:          []string{"trigger", "nmap", "--namespace", "foobar"},
			namespace:     "custom-ns",
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

func TestTriggerCommandCompletion(t *testing.T) {
	testcases := []struct {
		name          string
		namespace     string
		expectedScans []string
		setup         func(client.Client)
		expectedError bool
	}{
		{
			name:          "Should return all scheduled scans in the namespace",
			namespace:     "default",
			expectedScans: []string{"nmap-scan", "zap-scan"},
			setup: func(client client.Client) {
				scans := []v1.ScheduledScan{
					{ObjectMeta: metav1.ObjectMeta{Name: "nmap-scan", Namespace: "default"}},
					{ObjectMeta: metav1.ObjectMeta{Name: "zap-scan", Namespace: "default"}},
				}
				for _, scan := range scans {
					err := client.Create(context.Background(), &scan)
					if err != nil {
						t.Fatalf("Failed to create scan: %v", err)
					}
				}
			},
			expectedError: false,
		},
		{
			name:          "Should return empty list when no scans exist",
			namespace:     "empty-ns",
			expectedScans: []string{},
			setup:         func(client.Client) {},
			expectedError: false,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			scheme := runtime.NewScheme()
			utilruntime.Must(v1.AddToScheme(scheme))
			client := fake.NewClientBuilder().WithScheme(scheme).Build()

			if tc.setup != nil {
				tc.setup(client)
			}

			cmd := NewTriggerCommand()

			clientProvider = &TestClientProvider{
				Client:    client,
				namespace: tc.namespace,
				err:       nil,
			}

			kubeconfigArgs = genericclioptions.NewConfigFlags(true)

			completions, directive := cmd.ValidArgsFunction(cmd, []string{}, "")

			if tc.expectedError {
				assert.Equal(t, cobra.ShellCompDirectiveError, directive)
			} else {
				assert.Equal(t, cobra.ShellCompDirectiveDefault, directive)
				assert.ElementsMatch(t, tc.expectedScans, completions)
			}
		})
	}
}
