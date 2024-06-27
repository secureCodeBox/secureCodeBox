// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package util

import (
	"errors"
	"fmt"

	config "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/pkg/config"
	"k8s.io/utils/strings/slices"
)

func CheckUniquenessOfScanNames(scanConfigs []config.ScanConfig) error {
	var namesSeen []string
	for _, config := range scanConfigs {
		if slices.Contains(namesSeen, config.Name) {
			return errors.New(fmt.Sprintf("Scan names %s are not unique!", config.Name))
		}
		namesSeen = append(namesSeen, config.Name)
	}
	return nil
}
