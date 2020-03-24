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
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"

	scansv1 "experimental.securecodebox.io/api/v1"
)

// TargetReconciler reconciles a Target object
type TargetReconciler struct {
	client.Client
	Log    logr.Logger
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=scans.experimental.securecodebox.io,resources=targets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=scans.experimental.securecodebox.io,resources=targets/status,verbs=get;update;patch

func (r *TargetReconciler) Reconcile(req ctrl.Request) (ctrl.Result, error) {
	ctx := context.Background()
	log := r.Log.WithValues("target", req.NamespacedName)

	// your logic here

	log.Info("Starting Target Reconciler")

	var target scansv1.Target
	err := r.Get(ctx, req.NamespacedName, &target)
	if err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	if target.Status.State == "" {
		target.Status.State = "Scanning"
	}
	switch target.Status.State {
	case "Scanning":
		switch target.Spec.Type {
		case "Host":

		}
	case "Sleeping":
		// TODO: Reschedule
	}

	return ctrl.Result{}, nil
}

func (r *TargetReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&scansv1.Target{}).
		Complete(r)
}
