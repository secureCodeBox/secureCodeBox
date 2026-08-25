// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

const testFileContents = `{"findings": []}`

// writeResultFile creates a temporary scan result file and returns its path.
func writeResultFile(t *testing.T) string {
	t.Helper()

	path := filepath.Join(t.TempDir(), "findings.json")
	if err := os.WriteFile(path, []byte(testFileContents), 0o600); err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}
	return path
}

// stubSleep replaces the backoff sleep with a recorder, so that tests don't
// have to actually wait. Returns a pointer to the recorded delays.
func stubSleep(t *testing.T) *[]time.Duration {
	t.Helper()

	original := sleep
	delays := []time.Duration{}
	sleep = func(d time.Duration) {
		delays = append(delays, d)
	}
	t.Cleanup(func() { sleep = original })

	return &delays
}

func TestUploadFileWithRetriesSucceedsOnFirstAttempt(t *testing.T) {
	delays := stubSleep(t)

	requests := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	if err := uploadFileWithRetries(writeResultFile(t), server.URL); err != nil {
		t.Fatalf("expected upload to succeed, got: %v", err)
	}
	if requests != 1 {
		t.Errorf("expected 1 request, got %d", requests)
	}
	if len(*delays) != 0 {
		t.Errorf("expected no backoff, got %v", *delays)
	}
}

func TestUploadFileWithRetriesRetriesUntilSuccess(t *testing.T) {
	delays := stubSleep(t)

	requests := 0
	receivedBodies := []string{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++
		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Errorf("failed to read request body: %v", err)
		}
		receivedBodies = append(receivedBodies, string(body))

		if requests < 3 {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	if err := uploadFileWithRetries(writeResultFile(t), server.URL); err != nil {
		t.Fatalf("expected upload to succeed after retries, got: %v", err)
	}
	if requests != 3 {
		t.Errorf("expected 3 requests, got %d", requests)
	}

	// every attempt, especially the last one, has to send the complete file
	for attempt, body := range receivedBodies {
		if body != testFileContents {
			t.Errorf("attempt %d uploaded %q, expected %q", attempt+1, body, testFileContents)
		}
	}

	expectedDelays := uploadBackoffs[:2]
	if len(*delays) != len(expectedDelays) {
		t.Fatalf("expected %d backoffs, got %v", len(expectedDelays), *delays)
	}
	for i, delay := range *delays {
		if delay != expectedDelays[i] {
			t.Errorf("backoff %d was %s, expected %s", i+1, delay, expectedDelays[i])
		}
	}
}

func TestUploadFileWithRetriesGivesUpAfterAllAttempts(t *testing.T) {
	delays := stubSleep(t)

	requests := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	if err := uploadFileWithRetries(writeResultFile(t), server.URL); err == nil {
		t.Fatal("expected upload to fail")
	}

	expectedRequests := len(uploadBackoffs) + 1
	if requests != expectedRequests {
		t.Errorf("expected %d requests, got %d", expectedRequests, requests)
	}
	if len(*delays) != len(uploadBackoffs) {
		t.Errorf("expected %d backoffs, got %v", len(uploadBackoffs), *delays)
	}
	for i, delay := range *delays {
		if delay != uploadBackoffs[i] {
			t.Errorf("backoff %d was %s, expected %s", i+1, delay, uploadBackoffs[i])
		}
	}
}

func TestUploadFileWithRetriesRetriesTransportErrors(t *testing.T) {
	delays := stubSleep(t)

	// closing the server up front makes every attempt fail on the transport level
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	url := server.URL
	server.Close()

	if err := uploadFileWithRetries(writeResultFile(t), url); err == nil {
		t.Fatal("expected upload to fail")
	}
	if len(*delays) != len(uploadBackoffs) {
		t.Errorf("expected %d backoffs, got %v", len(uploadBackoffs), *delays)
	}
}

func TestUploadFileWithRetriesFailsForMissingFile(t *testing.T) {
	stubSleep(t)

	if err := uploadFileWithRetries(filepath.Join(t.TempDir(), "does-not-exist.json"), "http://127.0.0.1:1"); err == nil {
		t.Fatal("expected upload of a missing file to fail")
	}
}
