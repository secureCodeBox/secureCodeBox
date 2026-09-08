// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package hooksdk

import (
	"context"
	"encoding/json"
	"testing"
)

type contextKey struct{}

type stubK8sClient struct {
	scanCtx  context.Context
	patchCtx context.Context
}

func (s *stubK8sClient) GetScan(ctx context.Context, _, _ string) (*Scan, error) {
	s.scanCtx = ctx
	return &Scan{Name: "scan"}, nil
}

func (s *stubK8sClient) PatchScanStatus(ctx context.Context, _, _ string, _ []Finding) error {
	s.patchCtx = ctx
	return nil
}

type stubFileClient struct {
	downloadTextCtx context.Context
	downloadJSONCtx context.Context
	uploadCtx       context.Context
}

func (s *stubFileClient) DownloadText(ctx context.Context, _ string) (string, error) {
	s.downloadTextCtx = ctx
	return "raw results", nil
}

func (s *stubFileClient) DownloadJSON(ctx context.Context, _ string, value any) error {
	s.downloadJSONCtx = ctx
	data, err := json.Marshal([]Finding{validFinding()})
	if err != nil {
		return err
	}
	return json.Unmarshal(data, value)
}

func (s *stubFileClient) Upload(ctx context.Context, _ string, _ string, _ []byte) error {
	s.uploadCtx = ctx
	return nil
}

func TestHookRequestDefersOperationsAndPassesContext(t *testing.T) {
	k8sClient := &stubK8sClient{}
	fileClient := &stubFileClient{}
	request := &hookRequest{
		k8sClient:  k8sClient,
		fileClient: fileClient,
		scanName:   "scan",
		namespace:  "default",
		urls:       []string{"raw", "findings", "raw-upload", "findings-upload"},
	}
	ctx := context.WithValue(context.Background(), contextKey{}, "hook context")

	if _, err := request.Scan(ctx); err != nil {
		t.Fatal(err)
	}
	if _, err := request.GetRawResults(ctx); err != nil {
		t.Fatal(err)
	}
	findings, err := request.GetFindings(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if err := request.UpdateRawResults(ctx, "updated raw results"); err != nil {
		t.Fatal(err)
	}
	if err := request.UpdateFindings(ctx, findings); err != nil {
		t.Fatal(err)
	}

	for name, actual := range map[string]context.Context{
		"GetScan":         k8sClient.scanCtx,
		"DownloadText":    fileClient.downloadTextCtx,
		"DownloadJSON":    fileClient.downloadJSONCtx,
		"Upload":          fileClient.uploadCtx,
		"PatchScanStatus": k8sClient.patchCtx,
	} {
		if actual != ctx {
			t.Errorf("%s received a different context", name)
		}
	}
}
