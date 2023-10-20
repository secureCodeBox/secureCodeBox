// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package aws

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/go-logr/logr"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
)

// These tests use Ginkgo (BDD-style Go testing framework). Refer to
// http://onsi.github.io/ginkgo/ to learn more about Ginkgo.

// The aws tests are unit tests for helper functions, the main functionality is tested together with
// the kubernetes part in the main tests as integration tests

var log logr.Logger

func TestAWS(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "AWS Suite")
}

var _ = BeforeSuite(func() {
	log = zap.New(zap.WriteTo(GinkgoWriter), zap.UseDevMode(true))
})
