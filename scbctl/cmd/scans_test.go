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

type MockClientProvider struct {
	client.Client
	namespace string
	err       error
}

func (m *MockClientProvider) GetClient(_ *genericclioptions.ConfigFlags) (client.Client, string, error) {
	return m.Client, m.namespace, m.err
}

type testcase struct {
	name          string
	args          []string
	expectedError error
	expectedScan  *expectedScan
}

type expectedScan struct {
	name       string
	scanType   string
	namespace  string
	parameters []string
}

func TestScanCommand(t *testing.T) {
	testcases := []testcase{
		{
			name:          "Should create nmap scan with a single parameter",
			args:          []string{"scan", "nmap", "--", "scanme.nmap.org"},
			expectedError: nil,
			expectedScan: &expectedScan{
				name:       "nmap",
				scanType:   "nmap",
				namespace:  "default",
				parameters: []string{"scanme.nmap.org"},
			},
		},
		{
			name:          "Should create nmap scan with multiple parameters",
			args:          []string{"scan", "nmap", "--", "scanme.nmap.org", "-p", "90"},
			expectedError: nil,
			expectedScan: &expectedScan{
				name:       "nmap",
				scanType:   "nmap",
				namespace:  "default",
				parameters: []string{"scanme.nmap.org", "-p", "90"},
			},
		},
		{
			name:          "Should use --name flag as the name of the scan if provided",
			args:          []string{"scan", "--name", "scanme-nmap-org", "nmap", "--", "scanme.nmap.org"},
			expectedError: nil,
			expectedScan: &expectedScan{
				scanType:   "nmap",
				name:       "scanme-nmap-org",
				namespace:  "default",
				parameters: []string{"scanme.nmap.org"},
			},
		},
		{
			name:          "Should create nmap in a custom namespace",
			args:          []string{"scan", "--namespace", "foobar", "nmap", "--", "scanme.nmap.org"},
			expectedError: nil,
			expectedScan: &expectedScan{
				name:       "nmap",
				scanType:   "nmap",
				namespace:  "foobar",
				parameters: []string{"scanme.nmap.org"},
			},
		},
		{
			name:          "Flags provided after the `--` seperator should be passed as parameters, not flags",
			args:          []string{"scan", "--namespace", "foobar", "kubehunter", "--", "--namespace", "some-other-namespace"},
			expectedError: nil,
			expectedScan: &expectedScan{
				name:       "kubehunter",
				scanType:   "kubehunter",
				namespace:  "foobar",
				parameters: []string{"--namespace", "some-other-namespace"},
			},
		},
		{
			name:          "Should throw an error when no parameters are provided",
			args:          []string{"scan", "nmap"},
			expectedError: errors.New("you must use '--' to separate scan parameters"),
			expectedScan:  nil,
		},
		{
			name:          "Should throw an error when no `--` separator is used before the scan parameters",
			args:          []string{"scan", "nmap", "scanme.nmap.org"},
			expectedError: errors.New("you must use '--' to separate scan parameters"),
			expectedScan:  nil,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			scheme := runtime.NewScheme()
			utilruntime.Must(v1.AddToScheme(scheme))
			client := fake.NewClientBuilder().WithScheme(scheme).Build()
			clientProvider = &MockClientProvider{
				Client:    client,
				namespace: "default",
				err:       nil,
			}

			rootCmd := NewRootCommand()

			rootCmd.SetArgs(tc.args)
			rootCmd.SilenceUsage = true

			err := rootCmd.Execute()

			assert.Equal(t, tc.expectedError, err, "error returned by scan should match")

			if tc.expectedScan != nil {
				scans := &v1.ScanList{}
				listErr := client.List(context.Background(), scans)
				assert.Nil(t, listErr, "failed to list scans")
				assert.Len(t, scans.Items, 1, "expected 1 scan to be created")

				scan := scans.Items[0]

				assert.Equal(t, tc.expectedScan.name, scan.Name)
				assert.Equal(t, tc.expectedScan.namespace, scan.Namespace)
				assert.Equal(t, tc.expectedScan.scanType, scan.Spec.ScanType)
				assert.Equal(t, tc.expectedScan.parameters, scan.Spec.Parameters)
			}
		})
	}
}

func TestScanCommandCompletion(t *testing.T) {
	testcases := []struct {
		name          string
		namespace     string
		expectedTypes []string
		setup         func(client.Client)
		expectedError bool
	}{
		{
			name:          "Should return all scan types in the namespace",
			namespace:     "default",
			expectedTypes: []string{"nmap", "zap"},
			setup: func(client client.Client) {
				scanTypes := []v1.ScanType{
					{ObjectMeta: metav1.ObjectMeta{Name: "nmap", Namespace: "default"}},
					{ObjectMeta: metav1.ObjectMeta{Name: "zap", Namespace: "default"}},
				}
				for _, st := range scanTypes {
					err := client.Create(context.Background(), &st)
					if err != nil {
						t.Fatalf("Failed to create scan type: %v", err)
					}
				}
			},
			expectedError: false,
		},
		{
			name:          "Should return empty list when no scan types exist",
			namespace:     "empty-ns",
			expectedTypes: []string{},
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

			cmd := NewScanCommand()

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
				assert.Equal(t, cobra.ShellCompDirectiveNoFileComp, directive)
				assert.ElementsMatch(t, tc.expectedTypes, completions)
			}
		})
	}
}
