// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package util

import (
	"context"
	"fmt"

	"github.com/go-logr/logr"
	configv1 "github.com/secureCodeBox/secureCodeBox/auto-discovery/kubernetes/api/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/event"
	"sigs.k8s.io/controller-runtime/pkg/predicate"

	corev1 "k8s.io/api/core/v1"

	"k8s.io/apimachinery/pkg/types"
)

func getNamespace(client client.Client, name string) (*corev1.Namespace, error) {
	namespace := corev1.Namespace{}
	err := client.Get(context.Background(), types.NamespacedName{Name: name}, &namespace)
	if err != nil {
		return nil, err
	}

	return &namespace, nil
}

func getNamespaceName(object client.Object) string {
	if object.GetNamespace() == "" {
		// The Object is not namespaced...
		return object.GetName()
	}

	return object.GetNamespace()
}

func GetPredicates(client client.Client, log logr.Logger, resourceInclusionMode configv1.ResourceInclusionMode) predicate.Predicate {
	log.Info("Setting up Predicate Filter", "resourceInclusionMode", resourceInclusionMode)

	if resourceInclusionMode == configv1.EnabledPerResource {
		return getPredicatesForEnabledPerResource(client, log)
	} else if resourceInclusionMode == configv1.All {
		return getPredicatesForScanAll(client, log)
	} else if resourceInclusionMode == configv1.EnabledPerNamespace {
		return getPredicatesForEnabledPerNamespace(client, log)
	}

	panic(fmt.Errorf("Inalid resourceInclusion.mode configured: '%s'. Check docs for supported modes.", resourceInclusionMode))
}

func getPredicatesForEnabledPerNamespace(client client.Client, log logr.Logger) predicate.Predicate {
	return predicate.Funcs{
		CreateFunc: func(event event.CreateEvent) bool {

			if val, ok := event.Object.GetAnnotations()["auto-discovery.securecodebox.io/ignore"]; ok && val == "true" {
				return false
			}

			namespace, err := getNamespace(client, getNamespaceName(event.Object))
			if err != nil {
				log.Error(err, "Failed to get Namespace")
			}

			if val, ok := namespace.GetAnnotations()["auto-discovery.securecodebox.io/enabled"]; ok && val == "true" {
				return true
			}
			return false
		},
		DeleteFunc: func(event event.DeleteEvent) bool {
			if val, ok := event.Object.GetAnnotations()["auto-discovery.securecodebox.io/ignore"]; ok && val == "true" {
				return false
			}

			namespace, err := getNamespace(client, getNamespaceName(event.Object))
			if err != nil {
				log.Error(err, "Failed to get Namespace")
			}

			if val, ok := namespace.GetAnnotations()["auto-discovery.securecodebox.io/enabled"]; ok && val == "true" {
				return true
			}
			return false
		},
		UpdateFunc: func(event event.UpdateEvent) bool {
			if val, ok := event.ObjectNew.GetAnnotations()["auto-discovery.securecodebox.io/ignore"]; ok && val == "true" {
				return false
			}

			namespace, err := getNamespace(client, getNamespaceName(event.ObjectNew))
			if err != nil {
				log.Error(err, "Failed to get Namespace")
			}

			if val, ok := namespace.GetAnnotations()["auto-discovery.securecodebox.io/enabled"]; ok && val == "true" {
				return true
			}
			return false
		},
		GenericFunc: func(event event.GenericEvent) bool {
			if val, ok := event.Object.GetAnnotations()["auto-discovery.securecodebox.io/ignore"]; ok && val == "true" {
				return false
			}

			namespace, err := getNamespace(client, getNamespaceName(event.Object))
			if err != nil {
				log.Error(err, "Failed to get Namespace")
			}

			if val, ok := namespace.GetAnnotations()["auto-discovery.securecodebox.io/enabled"]; ok && val == "true" {
				return true
			}
			return false
		},
	}
}

func getPredicatesForEnabledPerResource(client client.Client, log logr.Logger) predicate.Predicate {
	return predicate.Funcs{
		CreateFunc: func(event event.CreateEvent) bool {
			if val, ok := event.Object.GetAnnotations()["auto-discovery.securecodebox.io/enabled"]; ok && val == "true" {
				return true
			}
			return false
		},
		DeleteFunc: func(event event.DeleteEvent) bool {
			if val, ok := event.Object.GetAnnotations()["auto-discovery.securecodebox.io/enabled"]; ok && val == "true" {
				return true
			}
			return false
		},
		UpdateFunc: func(event event.UpdateEvent) bool {
			if val, ok := event.ObjectNew.GetAnnotations()["auto-discovery.securecodebox.io/enabled"]; ok && val == "true" {
				return true
			}
			return false
		},
		GenericFunc: func(event event.GenericEvent) bool {
			if val, ok := event.Object.GetAnnotations()["auto-discovery.securecodebox.io/enabled"]; ok && val == "true" {
				return true
			}
			return false
		},
	}
}

func getPredicatesForScanAll(client client.Client, log logr.Logger) predicate.Predicate {
	return predicate.Funcs{
		CreateFunc: func(event event.CreateEvent) bool {
			if val, ok := event.Object.GetAnnotations()["auto-discovery.securecodebox.io/ignore"]; ok && val == "true" {
				return false
			}
			return true
		},
		DeleteFunc: func(event event.DeleteEvent) bool {
			if val, ok := event.Object.GetAnnotations()["auto-discovery.securecodebox.io/ignore"]; ok && val == "true" {
				return false
			}
			return true
		},
		UpdateFunc: func(event event.UpdateEvent) bool {
			if val, ok := event.ObjectNew.GetAnnotations()["auto-discovery.securecodebox.io/ignore"]; ok && val == "true" {
				return false
			}
			return true
		},
		GenericFunc: func(event event.GenericEvent) bool {
			if val, ok := event.Object.GetAnnotations()["auto-discovery.securecodebox.io/ignore"]; ok && val == "true" {
				return false
			}
			return true
		},
	}
}
