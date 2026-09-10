// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package util

import (
	"errors"
	"fmt"
	"slices"

	config "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/pkg/config"
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
