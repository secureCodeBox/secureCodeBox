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
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes/fake"
)

// Mock implementations
type MockSecretReader struct {
	configs []DockerConfigJSON
	err     error
}

func (m *MockSecretReader) ReadDockerConfigs(basePath string) ([]DockerConfigJSON, error) {
	return m.configs, m.err
}

type MockSecretCreator struct {
	createdSecrets []*v1.Secret
	err            error
}

func (m *MockSecretCreator) CreateSecret(ctx context.Context, secret *v1.Secret) error {
	if m.err != nil {
		return m.err
	}
	m.createdSecrets = append(m.createdSecrets, secret)
	return nil
}

func TestSecretManager_CreateTemporarySecret_Success(t *testing.T) {
	fakePod := &v1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "test-pod",
			Namespace: "test-namespace",
			UID:       types.UID("test-uid"),
		},
	}

	fakeClient := fake.NewSimpleClientset(fakePod)

	mockReader := &MockSecretReader{
		configs: []DockerConfigJSON{
			{
				Auths: map[string]AuthEntry{
					"registry.example.com": {
						Auth: base64.StdEncoding.EncodeToString([]byte("user:pass")),
					},
				},
			},
		},
	}

	mockCreator := &MockSecretCreator{}

	sm := NewSecretManagerWithOptions(
		fakeClient,
		"/secrets",
		"test-namespace",
		"test-pod",
		mockReader,
		mockCreator,
	)

	err := sm.CreateTemporarySecret(context.Background(), "temp-secret", "registry.example.com")

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if len(mockCreator.createdSecrets) != 1 {
		t.Fatalf("Expected 1 secret to be created, got: %d", len(mockCreator.createdSecrets))
	}

	secret := mockCreator.createdSecrets[0]
	if secret.Name != "temp-secret" {
		t.Errorf("Expected secret name 'temp-secret', got: %s", secret.Name)
	}

	expectedUsername := base64.StdEncoding.EncodeToString([]byte("user"))
	expectedPassword := base64.StdEncoding.EncodeToString([]byte("pass"))

	if string(secret.Data["username"]) != expectedUsername {
		t.Errorf("Expected username %s, got: %s", expectedUsername, string(secret.Data["username"]))
	}

	if string(secret.Data["password"]) != expectedPassword {
		t.Errorf("Expected password %s, got: %s", expectedPassword, string(secret.Data["password"]))
	}
}

func TestSecretManager_CreateTemporarySecret_WithUsernamePassword(t *testing.T) {
	fakePod := &v1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "test-pod",
			Namespace: "test-namespace",
			UID:       types.UID("test-uid"),
		},
	}

	fakeClient := fake.NewSimpleClientset(fakePod)

	// Mock reader with separate username/password fields
	mockReader := &MockSecretReader{
		configs: []DockerConfigJSON{
			{
				Auths: map[string]AuthEntry{
					"registry.example.com": {
						Username: "testuser",
						Password: "testpass",
					},
				},
			},
		},
	}

	mockCreator := &MockSecretCreator{}

	sm := NewSecretManagerWithOptions(
		fakeClient,
		"/secrets",
		"test-namespace",
		"test-pod",
		mockReader,
		mockCreator,
	)

	err := sm.CreateTemporarySecret(context.Background(), "temp-secret", "registry.example.com")

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	secret := mockCreator.createdSecrets[0]
	if string(secret.Data["username"]) != "testuser" {
		t.Errorf("Expected username 'testuser', got: %s", string(secret.Data["username"]))
	}

	if string(secret.Data["password"]) != "testpass" {
		t.Errorf("Expected password 'testpass', got: %s", string(secret.Data["password"]))
	}
}

func TestSecretManager_CreateTemporarySecret_DomainNotFound(t *testing.T) {
	fakeClient := fake.NewSimpleClientset()

	mockReader := &MockSecretReader{
		configs: []DockerConfigJSON{
			{
				Auths: map[string]AuthEntry{
					"other-registry.com": {
						Auth: base64.StdEncoding.EncodeToString([]byte("user:pass")),
					},
				},
			},
		},
	}

	mockCreator := &MockSecretCreator{}

	sm := NewSecretManagerWithOptions(
		fakeClient,
		"/secrets",
		"test-namespace",
		"test-pod",
		mockReader,
		mockCreator,
	)

	err := sm.CreateTemporarySecret(context.Background(), "temp-secret", "registry.example.com")

	if err == nil {
		t.Fatal("Expected error for domain not found")
	}

	expectedError := "no authentication found for domain: registry.example.com"
	if err.Error() != expectedError {
		t.Errorf("Expected error '%s', got: '%s'", expectedError, err.Error())
	}
}

func TestDefaultSecretReader_ReadDockerConfigs(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "docker-config-test")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	config := DockerConfigJSON{
		Auths: map[string]AuthEntry{
			"registry.example.com": {
				Auth: base64.StdEncoding.EncodeToString([]byte("user:pass")),
			},
		},
	}

	configData, err := json.Marshal(config)
	if err != nil {
		t.Fatalf("Failed to marshal config: %v", err)
	}

	configPath := filepath.Join(tempDir, dockerConfigFileName)
	if err := os.WriteFile(configPath, configData, 0644); err != nil {
		t.Fatalf("Failed to write config file: %v", err)
	}

	reader := &DefaultSecretReader{}
	configs, err := reader.ReadDockerConfigs(tempDir)

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if len(configs) != 1 {
		t.Fatalf("Expected 1 config, got: %d", len(configs))
	}

	if len(configs[0].Auths) != 1 {
		t.Fatalf("Expected 1 auth entry, got: %d", len(configs[0].Auths))
	}

	auth, exists := configs[0].Auths["registry.example.com"]
	if !exists {
		t.Fatal("Expected auth entry for registry.example.com not found")
	}

	expectedAuth := base64.StdEncoding.EncodeToString([]byte("user:pass"))
	if auth.Auth != expectedAuth {
		t.Errorf("Expected auth %s, got: %s", expectedAuth, auth.Auth)
	}
}

func TestExtractCredentials_AuthField(t *testing.T) {
	sm := &SecretManager{}

	auth := &AuthEntry{
		Auth: base64.StdEncoding.EncodeToString([]byte("testuser:testpass")),
	}

	creds, err := sm.extractCredentials(auth)

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	expectedUsername := base64.StdEncoding.EncodeToString([]byte("testuser"))
	expectedPassword := base64.StdEncoding.EncodeToString([]byte("testpass"))

	if creds.Username != expectedUsername {
		t.Errorf("Expected username %s, got: %s", expectedUsername, creds.Username)
	}

	if creds.Password != expectedPassword {
		t.Errorf("Expected password %s, got: %s", expectedPassword, creds.Password)
	}
}

func TestExtractCredentials_SeparateFields(t *testing.T) {
	sm := &SecretManager{}

	auth := &AuthEntry{
		Username: "testuser",
		Password: "testpass",
	}

	creds, err := sm.extractCredentials(auth)

	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if creds.Username != "testuser" {
		t.Errorf("Expected username 'testuser', got: %s", creds.Username)
	}

	if creds.Password != "testpass" {
		t.Errorf("Expected password 'testpass', got: %s", creds.Password)
	}
}
