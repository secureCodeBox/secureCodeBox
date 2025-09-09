// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package secret_extraction

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

// Constants for config
const (
	dockerConfigFileName = ".dockerconfigjson"
	defaultSecretsPath   = "/secrets"
)

// Env variable names
const (
	envPodName   = "POD_NAME"
	envNameSpace = "NAMESPACE"
)

type DockerConfigJSON struct {
	Auths map[string]AuthEntry `json:"auths"`
}

type AuthEntry struct {
	Auth     string `json:"auth,omitempty"`
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
}

type Credentials struct {
	Username string
	Password string
}

type SecretManager struct {
	k8sClient     kubernetes.Interface
	secretsPath   string
	namespace     string
	podName       string
	secretReader  SecretReader
	secretCreator SecretCreator
}

type SecretReader interface {
	ReadDockerConfigs(basePath string) ([]DockerConfigJSON, error)
}

type SecretCreator interface {
	CreateSecret(ctx context.Context, secret *v1.Secret) error
}

type DefaultSecretReader struct{}

type DefaultSecretCreator struct {
	client    kubernetes.Interface
	namespace string
}

func NewSecretManager() (*SecretManager, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to create in-cluster config: %w", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create k8s client: %w", err)
	}

	namespace := os.Getenv(envNameSpace)
	if namespace == "" {
		return nil, fmt.Errorf("environment variable %s is not set", envNameSpace)
	}

	podName := os.Getenv(envPodName)
	if podName == "" {
		return nil, fmt.Errorf("environment variable %s is not set", envPodName)
	}

	return &SecretManager{
		k8sClient:     clientset,
		secretsPath:   defaultSecretsPath,
		namespace:     namespace,
		podName:       podName,
		secretReader:  &DefaultSecretReader{},
		secretCreator: &DefaultSecretCreator{client: clientset, namespace: namespace},
	}, nil
}

// NewSecretManagerWithOptions creates a SecretManager with custom options (useful for testing)
func NewSecretManagerWithOptions(client kubernetes.Interface, secretsPath, namespace, podName string, reader SecretReader, creator SecretCreator) *SecretManager {
	return &SecretManager{
		k8sClient:     client,
		secretsPath:   secretsPath,
		namespace:     namespace,
		podName:       podName,
		secretReader:  reader,
		secretCreator: creator,
	}
}

func (sm *SecretManager) CreateTemporarySecret(ctx context.Context, temporarySecretName, domain string) error {
	if temporarySecretName == "" {
		return fmt.Errorf("temporary secret name cannot be empty")
	}

	if domain == "" {
		return fmt.Errorf("domain cannot be empty")
	}

	configs, err := sm.secretReader.ReadDockerConfigs(sm.secretsPath)
	if err != nil {
		return fmt.Errorf("failed to read Docker configs: %w", err)
	}

	authEntry := sm.findAuthForDomain(domain, configs)
	if authEntry == nil {
		return fmt.Errorf("no authentication found for domain: %s", domain)
	}

	creds, err := sm.extractCredentials(authEntry)
	if err != nil {
		return fmt.Errorf("failed to extract credentials for domain %s: %w", domain, err)
	}

	secret, err := sm.buildSecret(ctx, temporarySecretName, creds)
	if err != nil {
		return fmt.Errorf("failed to build secret: %w", err)
	}

	if err := sm.secretCreator.CreateSecret(ctx, secret); err != nil {
		return fmt.Errorf("failed to create temporary secret: %w", err)
	}

	return nil
}

func (sm *SecretManager) findAuthForDomain(domain string, configs []DockerConfigJSON) *AuthEntry {
	for _, config := range configs {
		if auth, exists := config.Auths[domain]; exists {
			return &auth
		}
	}
	return nil
}

func (sm *SecretManager) extractCredentials(auth *AuthEntry) (*Credentials, error) {
	if auth == nil {
		return nil, fmt.Errorf("auth entry is nil")
	}

	if auth.Auth != "" {
		decoded, err := base64.StdEncoding.DecodeString(auth.Auth)
		if err != nil {
			return nil, fmt.Errorf("failed to decode auth field: %w", err)
		}

		parts := strings.SplitN(string(decoded), ":", 2)
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid auth format, expected username:password")
		}

		return &Credentials{
			Username: base64.StdEncoding.EncodeToString([]byte(parts[0])),
			Password: base64.StdEncoding.EncodeToString([]byte(parts[1])),
		}, nil
	}

	if auth.Username != "" && auth.Password != "" {
		return &Credentials{
			Username: auth.Username,
			Password: auth.Password,
		}, nil
	}

	return nil, fmt.Errorf("auth entry does not contain valid credentials")
}

func (sm *SecretManager) buildSecret(ctx context.Context, secretName string, creds *Credentials) (*v1.Secret, error) {
	pod, err := sm.k8sClient.CoreV1().Pods(sm.namespace).Get(ctx, sm.podName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get pod %s: %w", sm.podName, err)
	}

	return &v1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      secretName,
			Namespace: sm.namespace,
			OwnerReferences: []metav1.OwnerReference{
				{
					APIVersion: "v1",
					Kind:       "Pod",
					Name:       sm.podName,
					UID:        pod.UID,
				},
			},
		},
		Data: map[string][]byte{
			"username": []byte(creds.Username),
			"password": []byte(creds.Password),
		},
		Type: v1.SecretTypeOpaque,
	}, nil
}
func (r *DefaultSecretReader) ReadDockerConfigs(basePath string) ([]DockerConfigJSON, error) {
	var configs []DockerConfigJSON
	var errors []error

	err := filepath.Walk(basePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			errors = append(errors, fmt.Errorf("error accessing path %s, %w", path, err))
			return nil
		}

		if info.IsDir() || filepath.Base(path) != dockerConfigFileName {
			return nil
		}

		config, err := r.readSingleConfig(path)
		if err != nil {
			errors = append(errors, fmt.Errorf("failed to read config from %s: %w", path, err))
		}

		configs = append(configs, *config)
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to walk directory %s: %w", basePath, err)
	}

	// Report non-fatal errors as warnings
	for _, e := range errors {
		fmt.Printf("Warning: %v\n", e)
	}

	return configs, nil
}

func (r *DefaultSecretReader) readSingleConfig(path string) (*DockerConfigJSON, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	var config DockerConfigJSON
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	return &config, nil
}

func (c *DefaultSecretCreator) CreateSecret(ctx context.Context, secret *v1.Secret) error {
	_, err := c.client.CoreV1().Secrets(c.namespace).Create(ctx, secret, metav1.CreateOptions{})
	return err
}

func CreateTemporarySecret(temporarySecretName string, domain string) error {
	manager, err := NewSecretManager()
	if err != nil {
		return err
	}

	return manager.CreateTemporarySecret(context.Background(), temporarySecretName, domain)
}
