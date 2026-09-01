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
	Handle(ctx context.Context, request *HookRequest) error
}

type HookRequest struct {
	Scan             *Scan
	GetRawResults    func() (string, error)
	GetFindings      func() ([]Finding, error)
	UpdateRawResults func(string) error
	UpdateFindings   func([]Finding) error
}

type Client struct {
	k8sClient  K8sClient
	fileClient FileClient
	logger     *slog.Logger
	scanName   string
	namespace  string
	args       []string
}

type Option func(*Client)

func WithK8sClient(client K8sClient) Option   { return func(c *Client) { c.k8sClient = client } }
func WithFileClient(client FileClient) Option { return func(c *Client) { c.fileClient = client } }
func WithArgs(args []string) Option           { return func(c *Client) { c.args = args } }
func WithLogger(logger *slog.Logger) Option   { return func(c *Client) { c.logger = logger } }

func NewClient(opts ...Option) (*Client, error) {
	scanName, namespace := os.Getenv("SCAN_NAME"), os.Getenv("NAMESPACE")
	if scanName == "" {
		return nil, fmt.Errorf("SCAN_NAME environment variable is required")
	}
	if namespace == "" {
		return nil, fmt.Errorf("NAMESPACE environment variable is required")
	}
	client := &Client{scanName: scanName, namespace: namespace, args: os.Args}
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
	scan, err := c.k8sClient.GetScan(ctx, c.scanName, c.namespace)
	if err != nil {
		return fmt.Errorf("get Scan from Kubernetes API: %w", err)
	}
	urls := c.args[1:]
	urlAt := func(index int) string {
		if index < len(urls) {
			return urls[index]
		}
		return ""
	}
	getRawResults := func() (string, error) {
		url := urlAt(0)
		if url == "" {
			return "", fmt.Errorf("raw results download URL not provided")
		}
		return c.fileClient.DownloadText(ctx, url)
	}
	getFindings := func() ([]Finding, error) {
		url := urlAt(1)
		if url == "" {
			return nil, fmt.Errorf("findings download URL not provided")
		}
		var findings []Finding
		if err := c.fileClient.DownloadJSON(ctx, url, &findings); err != nil {
			return nil, fmt.Errorf("download findings: %w", err)
		}
		for index, finding := range findings {
			if err := ValidateFinding(finding, index); err != nil {
				return nil, err
			}
		}
		return findings, nil
	}
	updateRawResults := func(content string) error {
		url := urlAt(2)
		if url == "" {
			return fmt.Errorf("cannot update raw results in a ReadOnly hook")
		}
		return c.fileClient.Upload(ctx, url, "", []byte(content))
	}
	updateFindings := func(findings []Finding) error {
		url := urlAt(3)
		if url == "" {
			return fmt.Errorf("cannot update findings in a ReadOnly hook")
		}
		for index, finding := range findings {
			if err := ValidateFinding(finding, index); err != nil {
				return err
			}
		}
		body, err := json.Marshal(findings)
		if err != nil {
			return fmt.Errorf("marshal findings: %w", err)
		}
		if err := c.fileClient.Upload(ctx, url, "", body); err != nil {
			return fmt.Errorf("upload findings: %w", err)
		}
		if err := c.k8sClient.PatchScanStatus(ctx, c.scanName, c.namespace, findings); err != nil {
			return fmt.Errorf("update scan status: %w", err)
		}
		return nil
	}
	if err := handler.Handle(ctx, &HookRequest{Scan: scan, GetRawResults: getRawResults, GetFindings: getFindings, UpdateRawResults: updateRawResults, UpdateFindings: updateFindings}); err != nil {
		return fmt.Errorf("run hook handler: %w", err)
	}
	return nil
}
