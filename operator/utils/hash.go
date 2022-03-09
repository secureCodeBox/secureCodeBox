// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package utils

import (
	"regexp"

	"github.com/mitchellh/hashstructure/v2"
	executionv1 "github.com/secureCodeBox/secureCodeBox/operator/apis/execution/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func HashScanType(scanType executionv1.ScanType) uint64 {
	hashTarget := executionv1.ScanType{}
	hashTarget.Spec = scanType.Spec

	metadata := metav1.ObjectMeta{}
	metadata.Name = scanType.ObjectMeta.Name
	metadata.Namespace = scanType.ObjectMeta.Namespace
	metadata.Labels = filterOutNonScbMapElements(scanType.ObjectMeta.Labels)
	metadata.Annotations = filterOutNonScbMapElements(scanType.ObjectMeta.Annotations)
	hashTarget.ObjectMeta = metadata

	hash, err := hashstructure.Hash(hashTarget, hashstructure.FormatV2, nil)

	if err != nil {
		panic(err)
	}

	return hash
}

func filterOutNonScbMapElements(m map[string]string) map[string]string {
	filteredMap := map[string]string{}

	re := regexp.MustCompile(`.*securecodebox\.io/.*`)
	for key, value := range m {
		if matches := re.MatchString(key); matches {
			filteredMap[key] = value
		}
	}
	return filteredMap
}
