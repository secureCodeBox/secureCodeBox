// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package hooksdk

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
)

type FileClient interface {
	DownloadText(ctx context.Context, url string) (string, error)
	DownloadJSON(ctx context.Context, url string, v any) error
	Upload(ctx context.Context, url string, contentType string, body []byte) error
}

type httpFileClient struct {
	client *http.Client
	logger *slog.Logger
}

func NewFileClient(logger *slog.Logger) FileClient {
	return &httpFileClient{client: &http.Client{}, logger: logger}
}

func (f *httpFileClient) DownloadText(ctx context.Context, url string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}
	resp, err := f.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("download file: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("file download failed with status %d: %s", resp.StatusCode, body)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response body: %w", err)
	}
	return string(body), nil
}

func (f *httpFileClient) DownloadJSON(ctx context.Context, url string, v any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	resp, err := f.client.Do(req)
	if err != nil {
		return fmt.Errorf("download file: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("file download failed with status %d: %s", resp.StatusCode, body)
	}
	decoder := json.NewDecoder(resp.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(v); err != nil {
		return fmt.Errorf("decode JSON: %w", err)
	}
	return nil
}

func (f *httpFileClient) Upload(ctx context.Context, url string, contentType string, body []byte) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, url, strings.NewReader(string(body)))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", contentType)
	resp, err := f.client.Do(req)
	if err != nil {
		return fmt.Errorf("upload file: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		responseBody, _ := io.ReadAll(resp.Body)
		f.logger.Error("file upload failed", slog.Int("status_code", resp.StatusCode), slog.String("response_body", string(responseBody)))
		return fmt.Errorf("file upload failed with status %d: %s", resp.StatusCode, responseBody)
	}
	return nil
}
