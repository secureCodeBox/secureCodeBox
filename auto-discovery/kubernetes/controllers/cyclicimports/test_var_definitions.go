package cyclicimports

import (
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/envtest"
)

var Cfg *rest.Config
var K8sClient client.Client
var TestEnv *envtest.Environment
