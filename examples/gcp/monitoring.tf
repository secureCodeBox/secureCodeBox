data "helm_repository" "loki" {
  name = "loki"
  url  = "https://grafana.github.io/loki/charts"
}

resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
  }
}

resource "helm_release" "prometheus-operator" {
  name       = "prometheus-operator"
  namespace  = "monitoring"
  repository = "stable"
  chart      = "prometheus-operator"
  version    = "8.5.3"

  values = [
    file("./values/prometheus-operator.yaml")
  ]

  depends_on = [kubernetes_namespace.monitoring]
}

resource "helm_release" "loki" {
  name       = "loki"
  namespace  = "monitoring"
  repository = data.helm_repository.loki.metadata[0].name
  chart      = "loki"
  version    = "0.22.0"

  set {
    name  = "serviceMonitor.enabled"
    value = "true"
  }

  depends_on = [kubernetes_namespace.monitoring, helm_release.prometheus-operator]
}

resource "helm_release" "promtail" {
  name       = "promtail"
  namespace  = "monitoring"
  repository = data.helm_repository.loki.metadata[0].name
  chart      = "promtail"
  version    = "0.16.0"

  set {
    name  = "loki.serviceName"
    value = "loki"
  }

  set {
    name  = "serviceMonitor.enabled"
    value = "true"
  }

  depends_on = [kubernetes_namespace.monitoring, helm_release.prometheus-operator, helm_release.loki]
}
