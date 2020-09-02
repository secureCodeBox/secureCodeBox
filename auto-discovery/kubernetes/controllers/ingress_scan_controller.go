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
	"fmt"

	"github.com/go-logr/logr"
	targetsv1 "github.com/secureCodeBox/secureCodeBox-v2/operator/apis/targets/v1"

	networking "k8s.io/api/networking/v1beta1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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

var (
	ownerKey = ".metadata.controller"
	apiGVStr = targetsv1.GroupVersion.String()
)

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

			var hostTargets targetsv1.HostList

			// Check if there is a target already, or create one
			r.List(
				context.Background(),
				&hostTargets,
				client.InNamespace(ingress.Namespace),
				client.MatchingField(ownerKey, ingress.Name),
			)
			r.Log.Info("Listed hosts", "Length", len(hostTargets.Items))

			host := targetsv1.Host{}

			found := false
			// Check if the ingress has a child Host with a matching Hostname
			for _, hostItem := range hostTargets.Items {
				r.Log.Info("Comparing Hostnames", "LoopyHostname", hostItem.Spec.Hostname, "IngressHostname", hostname)
				if hostItem.Spec.Hostname == hostname {
					r.Log.Info("Found Host")
					found = true
					host = hostItem
				}
			}
			if found == false {
				host.GenerateName = fmt.Sprintf("%s-", ingress.Name)
				host.Namespace = ingress.Namespace
				host.Spec.Hostname = hostname
				host.Spec.Ports = make([]targetsv1.HostPort, 0)

				if err := ctrl.SetControllerReference(&ingress, &host, r.Scheme); err != nil {
					return err
				}

				err := r.Create(context.Background(), &host)
				if err != nil {
					r.Log.Error(err, "unable to create host")
					return err
				}
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
	if err := mgr.GetFieldIndexer().IndexField(&targetsv1.Host{}, ownerKey, func(rawObj runtime.Object) []string {
		// grab the job object, extract the owner...
		host := rawObj.(*targetsv1.Host)
		owner := metav1.GetControllerOf(host)
		if owner == nil {
			return nil
		}
		// ...make sure it's a Host...
		if owner.APIVersion != "networking.k8s.io/v1beta1" || owner.Kind != "Ingress" {
			return nil
		}

		// ...and if so, return it
		return []string{owner.Name}
	}); err != nil {
		return err
	}

	isInDemoNamespaceFilter := predicate.Funcs{
		CreateFunc: func(event event.CreateEvent) bool {
			if val, ok := event.Meta.GetAnnotations()["auto-discovery.experimental.securecodebox.io/ignore"]; ok && val == "true" {
				return false
			}
			return event.Meta.GetNamespace() == "juice-shop" || event.Meta.GetNamespace() == "bodgeit"
		},
		DeleteFunc: func(event event.DeleteEvent) bool {
			if val, ok := event.Meta.GetAnnotations()["auto-discovery.experimental.securecodebox.io/ignore"]; ok && val == "true" {
				return false
			}
			return event.Meta.GetNamespace() == "juice-shop" || event.Meta.GetNamespace() == "bodgeit"
		},
		UpdateFunc: func(event event.UpdateEvent) bool {
			if val, ok := event.MetaNew.GetAnnotations()["auto-discovery.experimental.securecodebox.io/ignore"]; ok && val == "true" {
				return false
			}
			return event.MetaNew.GetNamespace() == "juice-shop" || event.MetaNew.GetNamespace() == "bodgeit"
		},
		GenericFunc: func(event event.GenericEvent) bool {
			if val, ok := event.Meta.GetAnnotations()["auto-discovery.experimental.securecodebox.io/ignore"]; ok && val == "true" {
				return false
			}
			return event.Meta.GetNamespace() == "juice-shop" || event.Meta.GetNamespace() == "bodgeit"
		},
	}

	return ctrl.NewControllerManagedBy(mgr).
		For(&networking.Ingress{}).WithEventFilter(isInDemoNamespaceFilter).
		Complete(r)
}
