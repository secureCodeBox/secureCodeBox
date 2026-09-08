# Go Hook SDK

The Go Hook SDK provides the runtime integration needed to author secureCodeBox hooks in Go. It reads the hook runtime configuration, creates Kubernetes and file clients, and exposes the scan, raw results, and findings through `HookRequest`.

## Authoring a Hook with the Go Hook SDK

Implement `hooksdk.HookHandler` and pass it to `Client.Run`. The context passed to `Handle` must be passed to every `HookRequest` operation so cancellation and deadlines reach the Kubernetes API and result-file storage.

```go
package main

import (
	"context"
	"log"

	hooksdk "github.com/secureCodeBox/secureCodeBox/hook-sdk/golang"
)

type handler struct{}

func (handler) Handle(ctx context.Context, request hooksdk.HookRequest) error {
	findings, err := request.GetFindings(ctx)
	if err != nil {
		return err
	}

	for index := range findings {
		findings[index].Severity = "HIGH"
	}

	return request.UpdateFindings(ctx, findings)
}

func main() {
	client, err := hooksdk.NewClient()
	if err != nil {
		log.Fatal(err)
	}
	if err := client.Run(context.Background(), handler{}); err != nil {
		log.Fatal(err)
	}
}
```

The SDK requires these environment variables, which secureCodeBox provides to hook jobs:

| Variable | Description |
| --- | --- |
| `SCAN_NAME` | Name of the Scan being processed. |
| `NAMESPACE` | Namespace containing the Scan. |

The hook job also supplies result URLs as command-line arguments. They are consumed internally by the SDK; hook code should access results only through `HookRequest`.

## Hook Request Operations

All operations are deferred: calling `Client.Run` does not retrieve the Scan or download results. Each operation uses the `context.Context` supplied at the call site.

| Method | Description |
| --- | --- |
| `Scan(ctx)` | Retrieves the current Scan from the Kubernetes API. |
| `GetRawResults(ctx)` | Downloads the scanner's raw result text. |
| `GetFindings(ctx)` | Downloads, decodes, and validates the scanner findings. |
| `UpdateRawResults(ctx, content)` | Uploads replacement raw results. |
| `UpdateFindings(ctx, findings)` | Validates and uploads findings, then updates the Scan finding summary. |

`UpdateRawResults` and `UpdateFindings` are available only to ReadAndWrite hooks. A ReadOnly hook returns an error if either update method is called. Findings supplied to `UpdateFindings` must satisfy the SDK's finding validation rules.

Use `Scan(ctx)` only when the hook needs Scan metadata or spec/status data. A hook that only processes findings does not need to load the Scan.

## Testing

Use `hooksdk.HookRequestMock` to unit-test handlers without Kubernetes, object storage, or local hook runtime configuration. Configure only the request methods relevant to the test; unconfigured methods return their zero values and no error.

```go
func TestHandlerUpdatesFindings(t *testing.T) {
	findings := []hooksdk.Finding{testFinding()}
	updated := false

	err := handler{}.Handle(context.Background(), &hooksdk.HookRequestMock{
		GetFindingsFunc: func(context.Context) ([]hooksdk.Finding, error) {
			return findings, nil
		},
		UpdateFindingsFunc: func(_ context.Context, result []hooksdk.Finding) error {
			updated = true
			findings = result
			return nil
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	if !updated {
		t.Fatal("expected findings to be updated")
	}
}
```

Run the SDK tests with:

```sh
go test ./...
```

The SDK's `Taskfile.yaml` also provides `task test`, which formats, vets, and tests the module.

## Local Development

When developing a hook in this repository, depend on the SDK module and use a local `replace` directive:

```go
require github.com/secureCodeBox/secureCodeBox/hook-sdk/golang v0.0.0

replace github.com/secureCodeBox/secureCodeBox/hook-sdk/golang => ../../../hook-sdk/golang
```

Adjust the replacement path for the location of your hook module.
