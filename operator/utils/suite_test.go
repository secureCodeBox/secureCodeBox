// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package utils

import (
	"testing"

	. "github.com/onsi/ginkgo"
	. "github.com/onsi/gomega"
)

func TestGinko(t *testing.T) {
	RegisterFailHandler(Fail)

	RunSpecs(t,
		"Utils Suite",
	)
}
