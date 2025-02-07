// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.service;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.util.ClientBuilder;
import io.kubernetes.client.util.Config;
import io.kubernetes.client.util.KubeConfig;
import io.kubernetes.client.util.generic.GenericKubernetesApi;
import io.securecodebox.models.V1Scan;
import io.securecodebox.models.V1ScanList;
import io.securecodebox.models.V1ScanStatusFindings;
import io.securecodebox.models.V1ScanStatusFindingsSeverities;
import io.securecodebox.persistence.config.EnvConfig;
import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import io.securecodebox.persistence.models.SecureCodeBoxFinding;
import lombok.extern.slf4j.Slf4j;
import okhttp3.Protocol;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;


@Slf4j
public class KubernetesService {
  private final EnvConfig env = new EnvConfig();

  ApiClient client;
  String scanName;
  String namespace;

  GenericKubernetesApi<V1Scan, V1ScanList> scanApi;

  public void init() throws IOException {
    final ClientBuilder clientBuilder;

    if (env.isDev()) {
      log.warn("Hook is executed in DEV MODE!");
      // loading the out-of-cluster config, a kubeconfig from file-system
      // FIXME: Usage of reading system properties should be encapsulated in own class.
      final var kubeConfigPath = System.getProperty("user.home") + "/.kube/config";
      try (final var kubeConfigReader = new FileReader(kubeConfigPath)) {
        clientBuilder = ClientBuilder.kubeconfig(KubeConfig.loadKubeConfig(kubeConfigReader));
      } catch (final IOException e) {
        final var msg = String.format("Can't read Kubernetes configuration! Tried file path was '%s'.", kubeConfigPath);
        throw new DefectDojoPersistenceException(msg);
      } catch (final Exception e) {
        final var msg = "Can't parse and create Kubernetes config! Reason: " + e.getMessage();
        throw new DefectDojoPersistenceException(msg, e);
      }
    } else {
      try {
        clientBuilder = ClientBuilder.cluster();
      } catch (final IllegalStateException e) {
        final var msg = String.format(
          "Could not create Kubernetes client config! Maybe the env var '%s' and/or '%s' is not set correct" +
          "ly.",
          Config.ENV_SERVICE_HOST,Config.ENV_SERVICE_PORT);
        throw new DefectDojoPersistenceException(msg);
      }
    }

    this.client = clientBuilder
      // the default of Http 2 seems to have some problem in which the client doesn't terminate correctly. (k8s client-java 12.0.0)
      .setProtocols(List.of(Protocol.HTTP_1_1))
      .build();

    this.scanName = env.scanName();

    if (this.scanName.isEmpty()) {
      this.scanName = "nmap-scanme.nmap.org";
    }

    this.namespace = env.namespace();

    if (this.namespace.isEmpty()) {
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
    log.debug("Fetched Scan from Kubernetes API");

    return response.getObject();
  }

  public void updateScanInKubernetes(List<SecureCodeBoxFinding> secureCodeBoxFindings) throws IOException {
    log.debug("Refetching the scan to minimize possibility to write conflicts");
    var scan = this.getScanFromKubernetes();

    Objects.requireNonNull(scan.getStatus(), "Scan status field is not set, this should have been previously set by the Operator and Parser.")
      .setFindings(recalculateFindingStats(secureCodeBoxFindings));

    log.info("Updating Scan metadata");
    scanApi.updateStatus(scan, V1Scan::getStatus);
    log.debug("Updated Scan metadata");
  }

  static V1ScanStatusFindings recalculateFindingStats(List<SecureCodeBoxFinding> secureCodeBoxFindings) {
    var stats = new V1ScanStatusFindings();

    stats.setCount((long) secureCodeBoxFindings.size());
    stats.setCategories(recalculateFindingCategoryStats(secureCodeBoxFindings));
    stats.setSeverities(recalculateFindingSeverityStats(secureCodeBoxFindings));

    return stats;
  }

  private static V1ScanStatusFindingsSeverities recalculateFindingSeverityStats(List<SecureCodeBoxFinding> secureCodeBoxFindings) {
    var severities = new V1ScanStatusFindingsSeverities();
    severities.setInformational(0L);
    severities.setLow(0L);
    severities.setMedium(0L);
    severities.setHigh(0L);
    for (var finding : secureCodeBoxFindings) {
      switch (finding.getSeverity()) {
        case HIGH:
          severities.setHigh(severities.getHigh() + 1L);
          break;
        case MEDIUM:
          severities.setMedium(severities.getMedium() + 1L);
          break;
        case LOW:
          severities.setLow(severities.getLow() + 1L);
          break;
        case INFORMATIONAL:
          severities.setInformational(severities.getInformational() + 1L);
          break;
      }
    }
    return severities;
  }

  private static HashMap<String, Long> recalculateFindingCategoryStats(List<SecureCodeBoxFinding> secureCodeBoxFindings) {
    var categories = new HashMap<String, Long>();
    for (var finding : secureCodeBoxFindings) {
      if (categories.containsKey(finding.getCategory())) {
        categories.put(finding.getCategory(), categories.get(finding.getCategory()) + 1);
      } else {
        categories.put(finding.getCategory(), 1L);
      }
    }
    return categories;
  }
}
