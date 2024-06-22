// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package cmd

import (
	"bytes"
	"context"
	"errors"
	"testing"

	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"github.com/stretchr/testify/assert"
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
	scheme := runtime.NewScheme()
	utilruntime.Must(v1.AddToScheme(scheme))

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
			args:          []string{"scan", "--namespace", "foobar", "kubeaudit", "--", "--namespace", "some-other-namespace"},
			expectedError: nil,
			expectedScan: &expectedScan{
				name:       "kubeaudit",
				scanType:   "kubeaudit",
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
			client := fake.NewClientBuilder().WithScheme(scheme).Build()
			clientProvider = &MockClientProvider{
				Client:    client,
				namespace: "default",
				err:       nil,
			}

			rootCmd := NewRootCommand()
			buf := new(bytes.Buffer)
			rootCmd.SetOut(buf)

			rootCmd.SetArgs(tc.args)
			rootCmd.SilenceUsage = true

			err := rootCmd.Execute()

			assert.Equal(t, err, tc.expectedError, "error returned by scan should match")

			if tc.expectedScan != nil {
				scans := &v1.ScanList{}
				if listErr := client.List(context.Background(), scans); listErr != nil {
					t.Fatalf("failed to list scans: %v", listErr)
				}
				if len(scans.Items) != 1 {
					t.Fatalf("expected 1 scan to created but got %d", len(scans.Items))
				}

				scan := scans.Items[0]

				assert.Equal(t, scan.Name, tc.expectedScan.name)
				assert.Equal(t, scan.Namespace, tc.expectedScan.namespace)
				assert.Equal(t, scan.Spec.ScanType, tc.expectedScan.scanType)
				assert.Equal(t, scan.Spec.Parameters, tc.expectedScan.parameters)
			}
		})
	}
}
