provider "google-beta" {
  credentials = file("./creds/serviceaccount.json")
  project     = var.project_name
  region      = "europe-west3"
}

provider "google" {
  credentials = file("./creds/serviceaccount.json")
  project     = var.project_name
  region      = "europe-west3"
}

data "google_client_config" "current" {}

provider "kubernetes" {
  version          = "~> 1.10"
  load_config_file = false
  host             = "https://${google_container_cluster.securecodebox-faas.endpoint}"
  token            = data.google_client_config.current.access_token
  cluster_ca_certificate = base64decode(
    google_container_cluster.securecodebox-faas.master_auth[0].cluster_ca_certificate,
  )
}

provider "helm" {
  kubernetes {
    load_config_file = false
    host             = "https://${google_container_cluster.securecodebox-faas.endpoint}"
    token            = data.google_client_config.current.access_token
    cluster_ca_certificate = base64decode(
      google_container_cluster.securecodebox-faas.master_auth[0].cluster_ca_certificate,
    )
  }
}
