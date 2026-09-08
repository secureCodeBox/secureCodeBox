// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package hooksdk

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
)

type HookHandler interface {
	Handle(ctx context.Context, request HookRequest) error
}

type HookRequest interface {
	Scan(ctx context.Context) (*Scan, error)
	GetRawResults(ctx context.Context) (string, error)
	GetFindings(ctx context.Context) ([]Finding, error)
	UpdateRawResults(ctx context.Context, content string) error
	UpdateFindings(ctx context.Context, findings []Finding) error
}

type hookRequest struct {
	k8sClient  K8sClient
	fileClient FileClient
	scanName   string
	namespace  string
	urls       []string
}

func (r *hookRequest) Scan(ctx context.Context) (*Scan, error) {
	scan, err := r.k8sClient.GetScan(ctx, r.scanName, r.namespace)
	if err != nil {
		return nil, fmt.Errorf("get Scan from Kubernetes API: %w", err)
	}
	return scan, nil
}

func (r *hookRequest) GetRawResults(ctx context.Context) (string, error) {
	url := r.urlAt(0)
	if url == "" {
		return "", fmt.Errorf("raw results download URL not provided")
	}
	return r.fileClient.DownloadText(ctx, url)
}

func (r *hookRequest) GetFindings(ctx context.Context) ([]Finding, error) {
	url := r.urlAt(1)
	if url == "" {
		return nil, fmt.Errorf("findings download URL not provided")
	}
	var findings []Finding
	if err := r.fileClient.DownloadJSON(ctx, url, &findings); err != nil {
		return nil, fmt.Errorf("download findings: %w", err)
	}
	for index := range findings {
		if err := ValidateFinding(&findings[index], index); err != nil {
			return nil, err
		}
	}
	return findings, nil
}

func (r *hookRequest) UpdateRawResults(ctx context.Context, content string) error {
	url := r.urlAt(2)
	if url == "" {
		return fmt.Errorf("cannot update raw results in a ReadOnly hook")
	}
	return r.fileClient.Upload(ctx, url, "", []byte(content))
}

func (r *hookRequest) UpdateFindings(ctx context.Context, findings []Finding) error {
	url := r.urlAt(3)
	if url == "" {
		return fmt.Errorf("cannot update findings in a ReadOnly hook")
	}
	for index := range findings {
		if err := ValidateFinding(&findings[index], index); err != nil {
			return err
		}
	}
	body, err := json.Marshal(findings)
	if err != nil {
		return fmt.Errorf("marshal findings: %w", err)
	}
	if err := r.fileClient.Upload(ctx, url, "", body); err != nil {
		return fmt.Errorf("upload findings: %w", err)
	}
	if err := r.k8sClient.PatchScanStatus(ctx, r.scanName, r.namespace, findings); err != nil {
		return fmt.Errorf("update scan status: %w", err)
	}
	return nil
}

func (r *hookRequest) urlAt(index int) string {
	if index < len(r.urls) {
		return r.urls[index]
	}
	return ""
}

type Client struct {
	k8sClient  K8sClient
	fileClient FileClient
	logger     *slog.Logger
	scanName   string
	namespace  string
	urls       []string
}

type Option func(*Client)

func WithK8sClient(client K8sClient) Option   { return func(c *Client) { c.k8sClient = client } }
func WithFileClient(client FileClient) Option { return func(c *Client) { c.fileClient = client } }

// WithArgs sets the operation URLs (rawResults, findings, rawResultsUpload,
// findingsUpload) used by Run, in that order.
func WithArgs(urls []string) Option         { return func(c *Client) { c.urls = urls } }
func WithLogger(logger *slog.Logger) Option { return func(c *Client) { c.logger = logger } }

func NewClient(opts ...Option) (*Client, error) {
	scanName, namespace := os.Getenv("SCAN_NAME"), os.Getenv("NAMESPACE")
	if scanName == "" {
		return nil, fmt.Errorf("SCAN_NAME environment variable is required")
	}
	if namespace == "" {
		return nil, fmt.Errorf("NAMESPACE environment variable is required")
	}
	client := &Client{scanName: scanName, namespace: namespace, urls: os.Args[1:]}
	for _, option := range opts {
		option(client)
	}
	if client.logger == nil {
		client.logger = slog.Default()
	}
	if client.k8sClient == nil {
		k8sClient, err := NewK8sClient()
		if err != nil {
			return nil, err
		}
		client.k8sClient = k8sClient
	}
	if client.fileClient == nil {
		client.fileClient = NewFileClient(client.logger)
	}
	return client, nil
}

func (c *Client) Run(ctx context.Context, handler HookHandler) error {
	request := &hookRequest{k8sClient: c.k8sClient, fileClient: c.fileClient, scanName: c.scanName, namespace: c.namespace, urls: c.urls}
	if err := handler.Handle(ctx, request); err != nil {
		return fmt.Errorf("run hook handler: %w", err)
	}
	return nil
}
