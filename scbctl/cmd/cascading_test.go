package cmd

import (
	"bytes"
	"strings"
	"testing"

	cascadingv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/cascading/v1"
	v1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	"github.com/stretchr/testify/assert"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

type MockCascadeClientProvider struct {
	client.Client
	namespace string
	err       error
}

func (m *MockCascadeClientProvider) GetClient(_ *genericclioptions.ConfigFlags) (client.Client, string, error) {
	return m.Client, m.namespace, m.err
}

type testcases struct {
	name           string
	args           []string
	expectedError  error
	expectedOutput string
	initialScans   []v1.Scan
	initialRules   []cascadingv1.CascadingRule
}

func TestCascadeCommand(t *testing.T) {
	testcases := []testcases{
			{
					name:          "Should display simple scan tree",
					args:          []string{"cascade"},
					expectedError: nil,
					expectedOutput: `Scans
└── nmap-scan
`,
					initialScans: []v1.Scan{
							{
									ObjectMeta: metav1.ObjectMeta{
											Name: "nmap-scan",
											Annotations: map[string]string{},
									},
									Spec: v1.ScanSpec{ScanType: "nmap"},
							},
					},
					initialRules: []cascadingv1.CascadingRule{},
			},
			{
					name:          "Should display scan tree with parent-child relationship",
					args:          []string{"cascade"},
					expectedError: nil,
					expectedOutput: `Scans
└── nmap-scan
	└── nuclei-scan
`,
					initialScans: []v1.Scan{
							{
									ObjectMeta: metav1.ObjectMeta{
											Name: "nmap-scan",
											Annotations: map[string]string{},
									},
									Spec: v1.ScanSpec{ScanType: "nmap"},
							},
							{
									ObjectMeta: metav1.ObjectMeta{
											Name: "nuclei-scan",
											Annotations: map[string]string{
													ParentScanAnnotation: "nmap-scan",
											},
									},
									Spec: v1.ScanSpec{ScanType: "nuclei"},
							},
					},
					initialRules: []cascadingv1.CascadingRule{},
			},
			{
					name:          "Should respect namespace flag",
					args:          []string{"cascade", "--namespace", "test-namespace"},
					expectedError: nil,
					expectedOutput: `Scans
└── nmap-scan
`,
					initialScans: []v1.Scan{
							{
									ObjectMeta: metav1.ObjectMeta{
											Name:      "nmap-scan",
											Namespace: "test-namespace",
											Annotations: map[string]string{},
									},
									Spec: v1.ScanSpec{ScanType: "nmap"},
							},
							{
									ObjectMeta: metav1.ObjectMeta{
											Name:      "other-scan",
											Namespace: "default",
											Annotations: map[string]string{},
									},
									Spec: v1.ScanSpec{ScanType: "nmap"},
							},
					},
					initialRules: []cascadingv1.CascadingRule{},
			},
			{
					name:          "Should display complex scan tree",
					args:          []string{"cascade"},
					expectedError: nil,
					expectedOutput: `Scans
└── nmap-scan
	├── nuclei-scan-1
	│   └── zap-scan
	└── nuclei-scan-2
`,
					initialScans: []v1.Scan{
							{
									ObjectMeta: metav1.ObjectMeta{
											Name: "nmap-scan",
											Annotations: map[string]string{},
									},
									Spec: v1.ScanSpec{ScanType: "nmap"},
							},
							{
									ObjectMeta: metav1.ObjectMeta{
											Name: "nuclei-scan-1",
											Annotations: map[string]string{
													ParentScanAnnotation: "nmap-scan",
											},
									},
									Spec: v1.ScanSpec{ScanType: "nuclei"},
							},
							{
									ObjectMeta: metav1.ObjectMeta{
											Name: "nuclei-scan-2",
											Annotations: map[string]string{
													ParentScanAnnotation: "nmap-scan",
											},
									},
									Spec: v1.ScanSpec{ScanType: "nuclei"},
							},
							{
									ObjectMeta: metav1.ObjectMeta{
											Name: "zap-scan",
											Annotations: map[string]string{
													ParentScanAnnotation: "nuclei-scan-1",
											},
									},
									Spec: v1.ScanSpec{ScanType: "zap"},
							},
					},
					initialRules: []cascadingv1.CascadingRule{},
			},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
				scheme := runtime.NewScheme()
				utilruntime.Must(v1.AddToScheme(scheme))
				utilruntime.Must(cascadingv1.AddToScheme(scheme))

				scanList := &v1.ScanList{
						Items: tc.initialScans,
				}
				client := fake.NewClientBuilder().
						WithScheme(scheme).
						WithLists(scanList).
						Build()

				clientProvider = &MockClientProvider{
						Client:    client,
						namespace: "default",
						err:       nil,
				}

				rootCmd := NewRootCommand()
				rootCmd.SetArgs(tc.args)
				rootCmd.SilenceUsage = true

				output := &bytes.Buffer{}
				rootCmd.SetOut(output)

				err := rootCmd.Execute()

				assert.Equal(t, tc.expectedError, err, "error returned by cascade should match")
				
				actualOutput := strings.TrimRight(output.String(), "\n")
				expectedOutput := strings.TrimRight(tc.expectedOutput, "\n")
				
				assert.Equal(t, expectedOutput, actualOutput, "output should match expected")

				if expectedOutput != actualOutput {
						t.Logf("Expected:\n%s", expectedOutput)
						t.Logf("Actual:\n%s", actualOutput)
				}
		})
}
}
