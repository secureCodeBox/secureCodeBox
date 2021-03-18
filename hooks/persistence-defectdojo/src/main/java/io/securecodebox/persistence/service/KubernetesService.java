package io.securecodebox.persistence.service;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.util.ClientBuilder;
import io.kubernetes.client.util.KubeConfig;
import io.kubernetes.client.util.generic.GenericKubernetesApi;
import io.securecodebox.models.V1Scan;
import io.securecodebox.models.V1ScanList;
import io.securecodebox.models.V1ScanStatusFindings;
import io.securecodebox.models.V1ScanStatusFindingsSeverities;
import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import io.securecodebox.persistence.models.Finding;
import okhttp3.Protocol;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;

public class KubernetesService {
  private static final Logger LOG = LoggerFactory.getLogger(KubernetesService.class);

  ApiClient client;
  String scanName;
  String namespace;

  GenericKubernetesApi<V1Scan, V1ScanList> scanApi;

  public void init() throws IOException {
    if ("true".equals(System.getenv("IS_DEV"))) {
      // loading the out-of-cluster config, a kubeconfig from file-system
      String kubeConfigPath = System.getProperty("user.home") + "/.kube/config";
      this.client = ClientBuilder.kubeconfig(KubeConfig.loadKubeConfig(new FileReader(kubeConfigPath)))
        // the default of Http 2 seems to have some problem in which the client doesn't terminate correctly. (k8s client-java 12.0.0)
        .setProtocols(List.of(Protocol.HTTP_1_1))
        .build();
    } else {
      this.client = ClientBuilder.cluster()
        // the default of Http 2 seems to have some problem in which the client doesn't terminate correctly. (k8s client-java 12.0.0)
        .setProtocols(List.of(Protocol.HTTP_1_1))
        .build();
    }

    this.scanName = System.getenv("SCAN_NAME");
    if (this.scanName == null) {
      this.scanName = "nmap-scanme.nmap.org";
    }
    this.namespace = System.getenv("NAMESPACE");
    if (this.namespace == null) {
      this.namespace = "default";
    }

    this.scanApi = new GenericKubernetesApi<>(
      V1Scan.class,
      V1ScanList.class,
      "execution.securecodebox.io",
      "v1",
      "scans",
      client
    );
  }

  public V1Scan getScanFromKubernetes() throws IOException {
    var response = scanApi.get(namespace, scanName);

    if (!response.isSuccess()) {
      throw new DefectDojoPersistenceException("Failed to fetch Scan '" + scanName + "' in Namespace '" + namespace + "' from Kubernetes API");
    }
    LOG.info("Fetched Scan from Kubernetes API");

    return response.getObject();
  }

  public void updateScanInKubernetes(List<Finding> findings) throws IOException {
    LOG.info("Refetching the scan to minimize possibility to write conflicts");
    var scan = this.getScanFromKubernetes();

    Objects.requireNonNull(scan.getStatus(), "Scan status field is not set, this should have been previously set by the Operator and Parser.")
      .setFindings(recalculateFindingStats(findings));

    LOG.info("Updating Scan metadata");
    scanApi.updateStatus(scan, V1Scan::getStatus);
    LOG.info("Updated Scan metadata");
  }

  static V1ScanStatusFindings recalculateFindingStats(List<Finding> findings) {
    var stats = new V1ScanStatusFindings();

    stats.setCount((long) findings.size());

    var categories = new HashMap<String, Long>();
    for (var finding: findings) {
      if (categories.containsKey(finding.getCategory())) {
        categories.put(finding.getCategory(), categories.get(finding.getCategory()) + 1);
      } else {
        categories.put(finding.getCategory(), 1L);
      }
    }
    stats.setCategories(categories);

    var severities = new V1ScanStatusFindingsSeverities();
    severities.setInformational(0L);
    severities.setLow(0L);
    severities.setMedium(0L);
    severities.setHigh(0L);
    for (var finding: findings) {
      switch (finding.getSeverity()) {
        case High:
          severities.setHigh(severities.getHigh() + 1L);
          break;
        case Medium:
          severities.setMedium(severities.getMedium() + 1L);
          break;
        case Low:
          severities.setLow(severities.getLow() + 1L);
          break;
        case Informational:
          severities.setInformational(severities.getInformational() + 1L);
          break;
      }
    }
    stats.setSeverities(severities);

    return stats;
  }
}
