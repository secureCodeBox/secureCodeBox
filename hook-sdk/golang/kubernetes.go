// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package hooksdk

import (
	"context"
	"encoding/json"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
)

type K8sClient interface {
	GetScan(ctx context.Context, name, namespace string) (*Scan, error)
	PatchScanStatus(ctx context.Context, name, namespace string, findings []Finding) error
}

type k8sClientImpl struct{ dynamicClient dynamic.Interface }

var scanGVR = schema.GroupVersionResource{Group: "execution.securecodebox.io", Version: "v1", Resource: "scans"}

func NewK8sClient() (K8sClient, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, fmt.Errorf("load in-cluster config: %w", err)
	}
	client, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("create dynamic client: %w", err)
	}
	return &k8sClientImpl{dynamicClient: client}, nil
}

func NewK8sClientWithDynamic(dynamicClient dynamic.Interface) K8sClient {
	return &k8sClientImpl{dynamicClient: dynamicClient}
}

func (k *k8sClientImpl) GetScan(ctx context.Context, name, namespace string) (*Scan, error) {
	object, err := k.dynamicClient.Resource(scanGVR).Namespace(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("get scan: %w", err)
	}
	scan := &Scan{Name: object.GetName(), Namespace: object.GetNamespace(), UID: string(object.GetUID()), Annotations: object.GetAnnotations(), Labels: object.GetLabels()}
	if spec, found, err := unstructured.NestedMap(object.Object, "spec"); err == nil && found {
		scan.Spec = spec
	}
	if status, found, err := unstructured.NestedMap(object.Object, "status"); err == nil && found {
		scan.Status = status
	}
	return scan, nil
}

func (k *k8sClientImpl) PatchScanStatus(ctx context.Context, name, namespace string, findings []Finding) error {
	patch, err := json.Marshal(map[string]any{"status": map[string]any{"findings": map[string]any{"count": len(findings), "severities": map[string]int{"informational": severityCount(findings, "INFORMATIONAL"), "low": severityCount(findings, "LOW"), "medium": severityCount(findings, "MEDIUM"), "high": severityCount(findings, "HIGH")}, "categories": buildCategoryMap(findings)}}})
	if err != nil {
		return fmt.Errorf("marshal status patch: %w", err)
	}
	_, err = k.dynamicClient.Resource(scanGVR).Namespace(namespace).Patch(ctx, name, types.MergePatchType, patch, metav1.PatchOptions{FieldManager: "securecodebox-hook"}, "status")
	if err != nil {
		return fmt.Errorf("patch scan status: %w", err)
	}
	return nil
}
