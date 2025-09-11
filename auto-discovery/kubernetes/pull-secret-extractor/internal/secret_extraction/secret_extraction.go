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
	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/config"
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

func CreateTemporarySecret(ctx context.Context, k8sClient client.Client, temporarySecretName, domain, namespace, podName, secretsPath string) error {
	if temporarySecretName == "" {
		return fmt.Errorf("temporary secret name cannot be empty")
	}

	if domain == "" {
		return fmt.Errorf("domain cannot be empty")
	}

	configs, err := readDockerConfigs(secretsPath)
	if err != nil {
		return fmt.Errorf("failed to read Docker configs: %w", err)
	}

	authEntry := findAuthForDomain(domain, configs)
	if authEntry == nil {
		return fmt.Errorf("no authentication found for domain: %s", domain)
	}

	creds, err := extractCredentials(authEntry)
	if err != nil {
		return fmt.Errorf("failed to extract credentials for domain %s: %w", domain, err)
	}

	secret, err := buildSecret(ctx, k8sClient, temporarySecretName, namespace, podName, creds)
	if err != nil {
		return fmt.Errorf("failed to build secret: %w", err)
	}

	if err := k8sClient.Create(ctx, secret); err != nil {
		return fmt.Errorf("failed to create temporary secret: %w", err)
	}

	return nil
}

func readDockerConfigs(basePath string) ([]DockerConfigJSON, error) {
	var configs []DockerConfigJSON

	err := filepath.Walk(basePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			fmt.Printf("Warning: error accessing path %s: %v\n", path, err)
			return nil
		}

		if info.IsDir() || filepath.Base(path) != dockerConfigFileName {
			return nil
		}

		config, err := readSingleConfig(path)
		if err != nil {
			fmt.Printf("Warning: failed to read config from %s: %v\n", path, err)
			return nil
		}

		configs = append(configs, *config)
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to walk directory %s: %w", basePath, err)
	}

	return configs, nil
}

func readSingleConfig(path string) (*DockerConfigJSON, error) {
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

func findAuthForDomain(domain string, configs []DockerConfigJSON) *AuthEntry {
	for _, config := range configs {
		if auth, exists := config.Auths[domain]; exists {
			return &auth
		}
	}
	return nil
}

func extractCredentials(auth *AuthEntry) (*Credentials, error) {
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

func buildSecret(ctx context.Context, k8sClient client.Client, secretName, namespace, podName string, creds *Credentials) (*v1.Secret, error) {
	pod := &v1.Pod{}
	if err := k8sClient.Get(ctx, client.ObjectKey{Name: podName, Namespace: namespace}, pod); err != nil {
		return nil, fmt.Errorf("failed to get pod %s: %w", podName, err)
	}

	return &v1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      secretName,
			Namespace: namespace,
			OwnerReferences: []metav1.OwnerReference{
				{
					APIVersion: "v1",
					Kind:       "Pod",
					Name:       podName,
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

func createK8sClient() (client.Client, error) {
	cfg, err := config.GetConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to get Kubernetes config: %w", err)
	}

	scheme := runtime.NewScheme()
	if err := v1.AddToScheme(scheme); err != nil {
		return nil, fmt.Errorf("failed to add core v1 to scheme: %w", err)
	}

	k8sClient, err := client.New(cfg, client.Options{Scheme: scheme})
	if err != nil {
		return nil, fmt.Errorf("failed to create Kubernetes client: %w", err)
	}

	return k8sClient, nil
}

func CreateTemporarySecretFromEnv(temporarySecretName, domain string) error {
	namespace := os.Getenv(envNameSpace)
	if namespace == "" {
		return fmt.Errorf("environment variable %s is not set", envNameSpace)
	}

	podName := os.Getenv(envPodName)
	if podName == "" {
		return fmt.Errorf("environment variable %s is not set", envPodName)
	}

	k8sClient, err := createK8sClient()
	if err != nil {
		return fmt.Errorf("failed to create Kubernetes client: %w", err)
	}

	ctx := context.Background()
	return CreateTemporarySecret(ctx, k8sClient, temporarySecretName, domain, namespace, podName, defaultSecretsPath)
}
