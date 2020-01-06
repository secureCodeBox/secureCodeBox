resource "google_container_cluster" "securecodebox-faas" {
  provider = google-beta

  name     = var.cluster_name
  network  = "default"
  location = "europe-west3-c"

  initial_node_count = 2

  release_channel {
    channel = "RAPID"
  }

  monitoring_service = "none"
  logging_service    = "none"

  # Setting an empty username and password explicitly disables basic auth
  master_auth {
    username = ""
    password = ""
  }

  enable_shielded_nodes = true

  node_config {
    # Initial node pool doesn't need to be too fancy as it will be deleted anyway...
    machine_type = "n1-standard-1"
    disk_size_gb = 20
    preemptible  = true

    # No point in having it not "secure" thought..
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    labels = {
      "kubernetes.io/os" = "linux"
    }
  }
}
