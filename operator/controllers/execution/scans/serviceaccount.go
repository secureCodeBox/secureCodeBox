// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package scancontrollers

import (
	"context"

	"reflect"

	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

func (r *ScanReconciler) ensureServiceAccountExists(namespace, serviceAccountName, description string, policyRules []rbacv1.PolicyRule) error {
	ctx := context.Background()

	var serviceAccount corev1.ServiceAccount
	err := r.Get(ctx, types.NamespacedName{Name: serviceAccountName, Namespace: namespace}, &serviceAccount)
	if apierrors.IsNotFound(err) {
		r.Log.Info("Creating missing service account", "serviceAccountName", serviceAccountName, "namespace", namespace)
		serviceAccount = corev1.ServiceAccount{
			ObjectMeta: metav1.ObjectMeta{
				Name:      serviceAccountName,
				Namespace: namespace,
				Annotations: map[string]string{
					"description": description,
				},
			},
		}
		err := r.Create(ctx, &serviceAccount)
		if err != nil {
			r.Log.Error(err, "Failed to create ServiceAccount", "serviceAccountName", serviceAccountName, "namespace", namespace)
			return err
		}
	} else if err != nil {
		r.Log.Error(err, "Unexpected error while checking if a ServiceAccount exists", "serviceAccountName", serviceAccountName, "namespace", namespace)
		return err
	}

	var role rbacv1.Role
	err = r.Get(ctx, types.NamespacedName{Name: serviceAccountName, Namespace: namespace}, &role)
	if apierrors.IsNotFound(err) {
		r.Log.Info("Creating missing Role", "roleName", serviceAccountName, "namespace", namespace)
		role = rbacv1.Role{
			ObjectMeta: metav1.ObjectMeta{
				Name:      serviceAccountName,
				Namespace: namespace,
				Annotations: map[string]string{
					"description": description,
				},
			},
			Rules: policyRules,
		}
		err := r.Create(ctx, &role)
		if err != nil {
			r.Log.Error(err, "Failed to create Role", "roleName", serviceAccountName, "namespace", namespace)
			return err
		}
	} else if !reflect.DeepEqual(role.Rules, policyRules) {
		r.Log.Info("Role already exists but not in the correct state")
		role.Rules = policyRules
		err := r.Update(ctx, &role)
		if err != nil {
			r.Log.Error(err, "Failed to update Role", "roleName", serviceAccountName, "namespace", namespace)
			return err
		}
	} else if err != nil {
		r.Log.Error(err, "Unexpected error while checking if a Role exists", "roleName", serviceAccountName, "namespace", namespace)
		return err
	}

	var roleBinding rbacv1.RoleBinding
	err = r.Get(ctx, types.NamespacedName{Name: serviceAccountName, Namespace: namespace}, &roleBinding)
	if apierrors.IsNotFound(err) {
		r.Log.Info("Creating missing RoleBinding", "roleName", serviceAccountName, "namespace", namespace)
		roleBinding = rbacv1.RoleBinding{
			ObjectMeta: metav1.ObjectMeta{
				Name:      serviceAccountName,
				Namespace: namespace,
				Annotations: map[string]string{
					"description": description,
				},
			},
			Subjects: []rbacv1.Subject{
				{
					Kind: "ServiceAccount",
					Name: serviceAccountName,
				},
			},
			RoleRef: rbacv1.RoleRef{
				Kind:     "Role",
				Name:     serviceAccountName,
				APIGroup: "rbac.authorization.k8s.io",
			},
		}
		err := r.Create(ctx, &roleBinding)
		if err != nil {
			r.Log.Error(err, "Failed to create RoleBinding", "roleName", serviceAccountName, "namespace", namespace)
			return err
		}
	} else if err != nil {
		r.Log.Error(err, "Unexpected error while checking if a RoleBinding exists", "roleName", serviceAccountName, "namespace", namespace)
		return err
	}

	return nil
}
