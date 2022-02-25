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
		r.Log.Info("Service Account doesn't exist creating now")
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
			r.Log.Error(err, "Failed to create ServiceAccount")
			return err
		}
	} else if err != nil {
		r.Log.Error(err, "Unexpected error while checking if a ServiceAccount exists")
		return err
	}

	var role rbacv1.Role
	err = r.Get(ctx, types.NamespacedName{Name: serviceAccountName, Namespace: namespace}, &role)
	if apierrors.IsNotFound(err) {
		r.Log.Info("Role doesn't exist creating now")
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
			r.Log.Error(err, "Failed to create Role")
			return err
		}
	} else if !reflect.DeepEqual(role.Rules, policyRules) {
		r.Log.Info("Role already exists but not in the correct state")
		role.Rules = policyRules
		err := r.Update(ctx, &role)
		if err != nil {
			r.Log.Error(err, "Failed to update Role")
			return err
		}
	} else if err != nil {
		r.Log.Error(err, "Unexpected error while checking if a Role exists")
		return err
	}

	var roleBinding rbacv1.RoleBinding
	err = r.Get(ctx, types.NamespacedName{Name: serviceAccountName, Namespace: namespace}, &roleBinding)
	if apierrors.IsNotFound(err) {
		r.Log.Info("RoleBinding doesn't exist creating now")
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
			r.Log.Error(err, "Failed to create RoleBinding")
			return err
		}
	} else if err != nil {
		r.Log.Error(err, "Unexpected error while checking if a RoleBinding exists")
		return err
	}

	return nil
}
