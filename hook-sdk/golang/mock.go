// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package hooksdk

import "context"

// HookRequestMock is a configurable HookRequest implementation for hook tests.
// Unconfigured methods return their zero values without an error.
type HookRequestMock struct {
	ScanFunc             func(context.Context) (*Scan, error)
	GetRawResultsFunc    func(context.Context) (string, error)
	GetFindingsFunc      func(context.Context) ([]Finding, error)
	UpdateRawResultsFunc func(context.Context, string) error
	UpdateFindingsFunc   func(context.Context, []Finding) error
}

func (m *HookRequestMock) Scan(ctx context.Context) (*Scan, error) {
	if m.ScanFunc != nil {
		return m.ScanFunc(ctx)
	}
	return nil, nil
}

func (m *HookRequestMock) GetRawResults(ctx context.Context) (string, error) {
	if m.GetRawResultsFunc != nil {
		return m.GetRawResultsFunc(ctx)
	}
	return "", nil
}

func (m *HookRequestMock) GetFindings(ctx context.Context) ([]Finding, error) {
	if m.GetFindingsFunc != nil {
		return m.GetFindingsFunc(ctx)
	}
	return nil, nil
}

func (m *HookRequestMock) UpdateRawResults(ctx context.Context, content string) error {
	if m.UpdateRawResultsFunc != nil {
		return m.UpdateRawResultsFunc(ctx, content)
	}
	return nil
}

func (m *HookRequestMock) UpdateFindings(ctx context.Context, findings []Finding) error {
	if m.UpdateFindingsFunc != nil {
		return m.UpdateFindingsFunc(ctx, findings)
	}
	return nil
}
