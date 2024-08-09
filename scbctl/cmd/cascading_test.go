package cmd

import (
	"bytes"
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
					ObjectMeta: metav1.ObjectMeta{Name: "nmap-scan"},
					Spec:       v1.ScanSpec{ScanType: "nmap"},
				},
			},
			initialRules: []cascadingv1.CascadingRule{},
		},
		{
			name:          "Should display scan tree with cascading rule",
			args:          []string{"cascade"},
			expectedError: nil,
			expectedOutput: `Scans
└── nmap-scan
    └── nuclei-scan
`,
			initialScans: []v1.Scan{
				{
					ObjectMeta: metav1.ObjectMeta{Name: "nmap-scan"},
					Spec:       v1.ScanSpec{ScanType: "nmap"},
					Status: v1.ScanStatus{
						Findings: v1.FindingStats{
							FindingSeverities: v1.FindingSeverities{High: 1},
						},
					},
				},
				{
					ObjectMeta: metav1.ObjectMeta{Name: "nuclei-scan"},
					Spec:       v1.ScanSpec{ScanType: "nuclei"},
				},
			},
			initialRules: []cascadingv1.CascadingRule{
				{
					Spec: cascadingv1.CascadingRuleSpec{
						Matches: cascadingv1.Matches{
							AnyOf: []cascadingv1.MatchesRule{
								{Severity: "High"},
							},
						},
						ScanSpec: v1.ScanSpec{ScanType: "nuclei"},
					},
				},
			},
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
					ObjectMeta: metav1.ObjectMeta{Name: "nmap-scan", Namespace: "test-namespace"},
					Spec:       v1.ScanSpec{ScanType: "nmap"},
				},
				{
					ObjectMeta: metav1.ObjectMeta{Name: "other-scan", Namespace: "default"},
					Spec:       v1.ScanSpec{ScanType: "nmap"},
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
			
			clientBuilder := fake.NewClientBuilder().WithScheme(scheme)
			for _, scan := range tc.initialScans {
				clientBuilder = clientBuilder.WithObjects(&scan)
			}
			for _, rule := range tc.initialRules {
				clientBuilder = clientBuilder.WithObjects(&rule)
			}
			client := clientBuilder.Build()
			
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
			assert.Equal(t, tc.expectedOutput, output.String(), "output should match expected")
		})
	}
}
