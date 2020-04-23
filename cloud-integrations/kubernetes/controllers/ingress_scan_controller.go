/*


Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controllers

import (
	"context"

	"github.com/go-logr/logr"
	networking "k8s.io/api/networking/v1beta1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/event"
	"sigs.k8s.io/controller-runtime/pkg/predicate"
)

// IngressScanReconciler reconciles a DeleteMe object
type IngressScanReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=networking,resources=ingress,verbs=get;list;watch
// +kubebuilder:rbac:groups=networking,resources=ingress/status,verbs=get

// Reconcile compares the Ingress object against the state of the cluster and updates both if needed
func (r *IngressScanReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	_ = context.Background()
	log := r.Log

	log.Info("Something happened to a ingress", "ingress", req.Name, "namespace", req.Namespace)

	return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller and initializes every thing it needs
func (r *IngressScanReconciler) SetupWithManager(mgr ctrl.Manager) error {

	isInDemoNamespaceFilter := predicate.Funcs{
		CreateFunc: func(event event.CreateEvent) bool {
			return event.Meta.GetNamespace() == "demo"
		},
		DeleteFunc: func(event event.DeleteEvent) bool {
			return event.Meta.GetNamespace() == "demo"
		},
		UpdateFunc: func(event event.UpdateEvent) bool {
			return event.MetaNew.GetNamespace() == "demo"
		},
		GenericFunc: func(event event.GenericEvent) bool {
			return event.Meta.GetNamespace() == "demo"
		},
	}

	return ctrl.NewControllerManagedBy(mgr).
		For(&networking.Ingress{}).WithEventFilter(isInDemoNamespaceFilter).
		Complete(r)
}
