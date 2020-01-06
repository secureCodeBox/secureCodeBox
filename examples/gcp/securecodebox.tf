resource "helm_release" "engine" {
  name  = "engine"
  chart = "../../engine/"
}

resource "helm_release" "dispatcher" {
  name  = "dispatcher"
  chart = "../../dispatcher/"

  set {
    name  = "dispatcherEnvironmentName"
    value = "gcp"
  }
  set {
    name  = "metrics.enabled"
    value = "true"
  }
  set {
    name  = "metrics.serviceMonitor.enabled"
    value = "true"
  }
  set {
    name  = "lurcherMetrics"
    value = "true"
  }
  set {
    name  = "prometheus-pushgateway.enabled"
    value = "true"
  }
}
