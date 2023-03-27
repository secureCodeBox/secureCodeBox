package util

import (
	"errors"
	"fmt"

	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"
	"k8s.io/utils/strings/slices"
)

func CheckUniquenessOfScanNames(scanConfigs []configv1.ScanConfig) error {
	var namesSeen []string
	for _, config := range scanConfigs {
		if slices.Contains(namesSeen, config.Name) {
			return errors.New(fmt.Sprintf("Scan names %s are not unique!", config.Name))
		}
		namesSeen = append(namesSeen, config.Name)
	}
	return nil
}
