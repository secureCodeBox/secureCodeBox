// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package secret_extraction

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

func TestCreateTemporarySecret(t *testing.T) {
	scheme := runtime.NewScheme()
	v1.AddToScheme(scheme)

	pod := &v1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "test-pod",
			Namespace: "test-namespace",
			UID:       types.UID("test-uid-123"),
		},
	}

	k8sClient := fake.NewClientBuilder().
		WithScheme(scheme).
		WithObjects(pod).
		Build()

	tempDir := t.TempDir()
	configPath := filepath.Join(tempDir, dockerConfigFileName)

	config := DockerConfigJSON{
		Auths: map[string]AuthEntry{
			"example.com": {
				Auth: base64.StdEncoding.EncodeToString([]byte("testuser:testpass")),
			},
		},
	}

	configData, _ := json.Marshal(config)
	os.WriteFile(configPath, configData, 0644)

	ctx := context.Background()
	err := CreateTemporarySecret(ctx, k8sClient, "test-secret", "example.com", "test-namespace", "test-pod", tempDir)

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	secret := &v1.Secret{}
	err = k8sClient.Get(ctx, client.ObjectKey{Name: "test-secret", Namespace: "test-namespace"}, secret)
	if err != nil {
		t.Fatalf("Secret was not created: %v", err)
	}

	expectedUsername := base64.StdEncoding.EncodeToString([]byte("testuser"))
	expectedPassword := base64.StdEncoding.EncodeToString([]byte("testpass"))

	if string(secret.Data["username"]) != expectedUsername {
		t.Errorf("Expected username %s, got %s", expectedUsername, string(secret.Data["username"]))
	}

	if string(secret.Data["password"]) != expectedPassword {
		t.Errorf("Expected password %s, got %s", expectedPassword, string(secret.Data["password"]))
	}

	if len(secret.OwnerReferences) != 1 {
		t.Fatalf("Expected 1 owner reference, got %d", len(secret.OwnerReferences))
	}

	ownerRef := secret.OwnerReferences[0]
	if ownerRef.Name != "test-pod" || ownerRef.UID != "test-uid-123" {
		t.Errorf("Owner reference not set correctly: %+v", ownerRef)
	}
}

func TestReadDockerConfigs(t *testing.T) {
	tempDir := t.TempDir()

	configPath := filepath.Join(tempDir, dockerConfigFileName)
	config := DockerConfigJSON{
		Auths: map[string]AuthEntry{
			"registry.example.com": {
				Username: "testuser",
				Password: "testpass",
			},
		},
	}

	configData, _ := json.Marshal(config)
	os.WriteFile(configPath, configData, 0644)

	configs, err := readDockerConfigs(tempDir)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if len(configs) != 1 {
		t.Fatalf("Expected 1 config, got %d", len(configs))
	}

	auth, exists := configs[0].Auths["registry.example.com"]
	if !exists {
		t.Fatal("Expected auth entry for registry.example.com")
	}

	if auth.Username != "testuser" || auth.Password != "testpass" {
		t.Errorf("Expected testuser/testpass, got %s/%s", auth.Username, auth.Password)
	}
}

func TestExtractCredentials(t *testing.T) {
	tests := []struct {
		name        string
		auth        *AuthEntry
		expectCreds bool
		expectError bool
	}{
		{
			name: "base64 auth field",
			auth: &AuthEntry{
				Auth: base64.StdEncoding.EncodeToString([]byte("user:pass")),
			},
			expectCreds: true,
		},
		{
			name: "separate username/password fields",
			auth: &AuthEntry{
				Username: "user",
				Password: "pass",
			},
			expectCreds: true,
		},
		{
			name:        "nil auth entry",
			auth:        nil,
			expectError: true,
		},
		{
			name:        "empty auth entry",
			auth:        &AuthEntry{},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			creds, err := extractCredentials(tt.auth)

			if tt.expectError && err == nil {
				t.Error("Expected error, got none")
			}

			if !tt.expectError && err != nil {
				t.Errorf("Expected no error, got: %v", err)
			}

			if tt.expectCreds && creds == nil {
				t.Error("Expected credentials, got nil")
			}
		})
	}
}
