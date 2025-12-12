// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package output

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

const defaultOutputFileName = "git-repo-scanner-findings.json"

func WriteFindings(fileOutput string, findings any) error {
	outputPath, err := resolveOutputPath(fileOutput)
	if err != nil {
		return err
	}

	var data []byte
	data, err = json.MarshalIndent(findings, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal findings: %w", err)
	}

	if err := os.WriteFile(outputPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}

func resolveOutputPath(fileOutput string) (string, error) {
	// Create directory if it doesn't exist
	dir := filepath.Dir(fileOutput)
	if dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return "", fmt.Errorf("failed to create output directory: %w", err)
		}
	}

	// Check if fileOutput is a directory
	fileInfo, err := os.Stat(fileOutput)
	if err == nil && fileInfo.IsDir() {
		return filepath.Join(fileOutput, defaultOutputFileName), nil
	}

	// If no extension, treat as directory
	if filepath.Ext(fileOutput) == "" {
		if err := os.MkdirAll(fileOutput, 0755); err != nil {
			return "", fmt.Errorf("failed to create output directory: %w", err)
		}
		return filepath.Join(fileOutput, defaultOutputFileName), nil
	}

	return fileOutput, nil
}
