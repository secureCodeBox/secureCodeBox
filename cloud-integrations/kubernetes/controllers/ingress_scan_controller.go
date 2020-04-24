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
	targetsv1 "github.com/secureCodeBox/secureCodeBox-v2-alpha/operator/apis/targets/v1"

	networking "k8s.io/api/networking/v1beta1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
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
	ctx := context.Background()
	log := r.Log

	log.Info("Something happened to a ingress", "ingress", req.Name, "namespace", req.Namespace)

	var ingress networking.Ingress
	if err := r.Get(ctx, req.NamespacedName, &ingress); err != nil {
		// we'll ignore not-found errors, since they can't be fixed by an immediate
		// requeue (we'll need to wait for a new notification), and we can get them
		// on deleted requests.
		log.V(7).Info("Unable to fetch Ingress")
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	err := r.CreateOrUpdateTlsForHosts(ingress)
	if err != nil {
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

func (r *IngressScanReconciler) CreateOrUpdateTlsForHosts(ingress networking.Ingress) error {
	if ingress.Spec.TLS == nil {
		return nil
	}

	for _, tlsConfig := range ingress.Spec.TLS {
		for _, hostname := range tlsConfig.Hosts {
			// Check if there is a target already, or create one
			host := targetsv1.Host{}
			err := r.Get(context.Background(), types.NamespacedName{Name: hostname, Namespace: ingress.Namespace}, &host)
			if apierrors.IsNotFound(err) {
				host.Name = hostname
				host.Namespace = ingress.Namespace
				host.Spec.Hostname = hostname
				host.Spec.Ports = make([]targetsv1.HostPort, 0)
				err = r.Create(context.Background(), &host)
				if err != nil {
					r.Log.Error(err, "unable to create host")
					return err
				}
			} else if err != nil {
				r.Log.Error(err, "unable to get host")
				return err
			}

			containsHTTPSPort := false
			if host.Spec.Ports == nil {
				host.Spec.Ports = make([]targetsv1.HostPort, 0)
			}
			for _, port := range host.Spec.Ports {
				if port.Port == 443 {
					containsHTTPSPort = true
					break
				}
			}

			if containsHTTPSPort == false {
				httpsPort := targetsv1.HostPort{
					Type: "https",
					Port: 443,
				}
				host.Spec.Ports = append(host.Spec.Ports, httpsPort)

				err := r.Update(context.Background(), &host)
				if err != nil {
					r.Log.Error(err, "Failed to add https port to target")
					return err
				}
			}
		}
	}

	return nil
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
