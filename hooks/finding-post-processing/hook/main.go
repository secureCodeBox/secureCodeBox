// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"log"
	"os"

	hooksdk "github.com/secureCodeBox/secureCodeBox/hook-sdk/golang"
)

func main() {
	handler, err := newHandler(os.Getenv("RULES"))
	if err != nil {
		log.Fatal(err)
	}
	client, err := hooksdk.NewClient()
	if err != nil {
		log.Fatal(err)
	}
	if err := client.Run(context.Background(), handler); err != nil {
		log.Fatal(err)
	}
}
