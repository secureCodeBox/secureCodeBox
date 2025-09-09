// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/secureCodeBox/auto-discovery/kubernetes/pull-secret-extractor/internal/docker_image"
	secret_extraction "github.com/secureCodeBox/auto-discovery/kubernetes/pull-secret-extractor/internal/secret_extraction"
)

const AppName = "pull-secret-extractor"

type Config struct {
	ImageID             string
	TemporarySecretName string
}

func parseFlags() (*Config, error) {
	config := &Config{}

	flag.StringVar(&config.ImageID, "imageID", "", "Docker image ID to extract domain from (required)")
	flag.StringVar(&config.TemporarySecretName, "secret", "", "Name for the temporary secret (required)")

	flag.Parse()

	// If flags are not provided, use positional arguments
	if config.ImageID == "" && config.TemporarySecretName == "" {
		args := flag.Args()
		if len(args) < 2 {
			return nil, fmt.Errorf("usage: program <imageID> <secretName> OR use -imageID and -secret flags")
		}
		config.ImageID = args[0]
		config.TemporarySecretName = args[1]
	}

	if config.ImageID == "" {
		return nil, fmt.Errorf("image ID is required (use -imageID flag or provide as first argument)")
	}

	if config.TemporarySecretName == "" {
		return nil, fmt.Errorf("temporary secret name is required (use -secret flag or provide as second argument)")
	}

	return config, nil
}

func run(config *Config) error {
	domain := docker_image.GetDomainFromDockerImage(config.ImageID)
	if domain == "" {
		return fmt.Errorf("failed to extract domain from image ID: %s", config.ImageID)
	}

	if err := secret_extraction.CreateTemporarySecret(config.TemporarySecretName, domain); err != nil {
		return fmt.Errorf("failed to create temporary secret: %w", err)
	}

	log.Printf("Successfully created temporary secret '%s' for domain '%s'",
		config.TemporarySecretName, domain)

	return nil
}

func main() {
	log.SetPrefix(fmt.Sprintf("[%s] ", AppName))
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	config, err := parseFlags()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n\n", err)
		flag.Usage()
		os.Exit(1)
	}

	if err := run(config); err != nil {
		log.Printf("Application failed: %v", err)
		os.Exit(1)
	}
}
