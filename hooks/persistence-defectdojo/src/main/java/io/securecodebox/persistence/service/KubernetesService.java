package io.securecodebox.persistence.service;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.util.ClientBuilder;
import io.kubernetes.client.util.KubeConfig;
import io.kubernetes.client.util.generic.GenericKubernetesApi;
import io.securecodebox.models.V1Scan;
import io.securecodebox.models.V1ScanList;
import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileReader;
import java.io.IOException;

public class KubernetesService {
  private static final Logger LOG = LoggerFactory.getLogger(KubernetesService.class);

  ApiClient client;
  String scanName;
  String namespace;

  public void init() throws IOException {
    if ("true".equals(System.getenv("IS_DEV"))) {
      // loading the out-of-cluster config, a kubeconfig from file-system
      String kubeConfigPath = System.getProperty("user.home") + "/.kube/config";
      this.client = ClientBuilder.kubeconfig(KubeConfig.loadKubeConfig(new FileReader(kubeConfigPath))).build();
    } else {
      this.client = ClientBuilder.cluster().build();
    }

    // set the global default api-client to the in-cluster one from above
    Configuration.setDefaultApiClient(client);

    this.scanName = System.getenv("SCAN_NAME");
    if (this.scanName == null) {
      this.scanName = "nmap-scanme.nmap.org";
    }
    this.namespace = System.getenv("NAMESPACE");
    if (this.namespace == null) {
      this.namespace = "default";
    }

    // set the global default api-client to the in-cluster one from above
    Configuration.setDefaultApiClient(client);
  }

  public V1Scan getScanFromKubernetes() throws IOException {
    GenericKubernetesApi<V1Scan, V1ScanList> scanApi =
      new GenericKubernetesApi<>(
        V1Scan.class,
        V1ScanList.class,
        "execution.securecodebox.io",
        "v1",
        "scans",
        ClientBuilder.defaultClient());

    var response = scanApi.get(namespace, scanName);

    if (!response.isSuccess()) {
      throw new DefectDojoPersistenceException("Failed to fetch Scan '" + scanName + "' in Namespace '" + namespace + "' from Kubernetes API");
    }
    LOG.info("Fetched Scan from Kubernetes API");

    return response.getObject();
  }
}
