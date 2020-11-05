/*
 *
 *  SecureCodeBox (SCB)
 *  Copyright 2015-2020 iteratec GmbH
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  	http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 * /
 */
package io.securecodebox.persistence;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.ApiException;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.util.ClientBuilder;
import io.kubernetes.client.util.KubeConfig;
import io.kubernetes.client.util.generic.GenericKubernetesApi;
import io.securecodebox.models.V1Scan;
import io.securecodebox.models.V1ScanList;
import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import io.securecodebox.persistence.exceptions.DefectDojoUnreachableException;
import io.securecodebox.persistence.models.SecureCodeBoxScanAnnotations;
import io.securecodebox.persistence.models.TestPayload;
import io.securecodebox.persistence.service.*;
import io.securecodebox.persistence.util.DescriptionGenerator;
import io.securecodebox.persistence.util.ScanNameMapping;
import org.joda.time.DateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.io.FileReader;
import java.io.IOException;
import java.net.URL;
import java.net.URLConnection;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@SpringBootApplication
public class DefectDojoPersistenceProvider {
  private static final Logger LOG = LoggerFactory.getLogger(DefectDojoPersistenceProvider.class);

  @Value("${securecodebox.persistence.defectdojo.url}")
  protected String defectDojoUrl;

  @Value("${securecodebox.persistence.defectdojo.auth.name}")
  protected String defectDojoUser;

  @Autowired
  private DefectDojoUserService defectDojoUserService;

  @Autowired
  private DescriptionGenerator descriptionGenerator;

  @Autowired
  private DefectDojoFindingService defectFindingService;

  @Autowired
  private DefectDojoToolService defectDojoToolService;

  @Autowired
  private DefectDojoEngagementService defectDojoEngagementService;

  @Autowired
  private DefectDojoTestService defectDojoTestService;

  @Autowired
  private DefectDojoProductService defectDojoProductService;

  @Autowired
  private Environment environment;


  public static void main(String[] args) {
    SpringApplication.run(DefectDojoPersistenceProvider.class, args);
  }

  @Bean
  public CommandLineRunner commandLineRunner(ApplicationContext ctx) {
    return args -> {
      var scan = getScanFromKubernetes();
      this.persist(scan);
    };
  }

  /**
   * Persists the given securityTest within DefectDojo.
   *
   * @param scan The securityTest to persist.
   * @throws DefectDojoPersistenceException If any persistence error occurs.
   */
  public void persist(V1Scan scan) throws DefectDojoPersistenceException {
    LOG.debug("Starting DefectDojo persistence provider");

    Objects.requireNonNull(scan.getStatus());
    Objects.requireNonNull(scan.getSpec());
    Objects.requireNonNull(scan.getMetadata());

    LOG.debug("RawFindings: {}", scan.getStatus().getRawResultDownloadLink());

    try {
      persistInDefectDojo(scan);
    } catch (Exception e) {
      // ignore error if defect dojo provider is set to optional
      LOG.error("Failed to persist security test in defect dojo", e);
    }
  }

  /**
   * Persists a given securityTest within DefectDojo.
   *
   * @param scan The scan to persist.
   * @throws io.securecodebox.persistence.exceptions.DefectDojoPersistenceException If any persistence error occurs.
   */
  private void persistInDefectDojo(V1Scan scan) throws DefectDojoPersistenceException {
    LOG.info("Checking if DefectDojo is reachable");
    checkConnection();
    LOG.info("DefectDojo is reachable");

    LOG.info("Checking if DefectDojo Tool Types exist");
    this.defectDojoToolService.ensureToolTypesExistence();

    LOG.info("Getting DefectDojo User Id");
    long userId = defectDojoUserService.getUserId(defectDojoUser);
    LOG.info("Running with DefectDojo User Id: {}", userId);

    long productTypeId = this.ensureProductTypeExistsForScan(scan);
    long productId = this.ensureProductExistsForScan(scan, productTypeId);

    LOG.info("Looking for existing or creating new DefectDojo Engagement");
    long engagementId = this.defectDojoEngagementService.createEngagement(scan, productId, userId);
    LOG.info("Using Engagement with Id: '{}'", engagementId);

    LOG.info("Downloading Scan Report (RawResults)");
    String result = this.getRawResults(scan);
    LOG.info("Finished Downloading Scan Report (RawResults)");

    var testId = this.createTest(scan, engagementId, userId);

    LOG.info("Uploading Scan Report (RawResults) to DefectDojo");
    var ddTest = defectFindingService.createFindingsReImport(
      result,
      testId,
      userId,
      this.descriptionGenerator.currentDate(),
      ScanNameMapping.bySecureCodeBoxScanType(scan.getSpec().getScanType()).scanType,
      new LinkedMultiValueMap<>()
    );
    LOG.info("Uploaded Scan Report (RawResults) as testID {} to DefectDojo", ddTest.getTestId());
    LOG.info("All done!");
  }

  /**
   * Checks if DefectDojo is available and reachable.
   *
   * @throws DefectDojoUnreachableException If DefectDojo is not reachable
   */
  public void checkConnection() throws DefectDojoUnreachableException {
    try {
      final URLConnection connection = new URL(defectDojoUserService.defectDojoUrl).openConnection();
      connection.connect();
    } catch (final Exception e) {
      throw new DefectDojoUnreachableException("Could not reach defectdojo at '" + defectDojoUserService.defectDojoUrl + "'!");
    }
  }

  private V1Scan getScanFromKubernetes() throws IOException {
    ApiClient client;

    if (Arrays.asList(environment.getActiveProfiles()).contains("prod")) {
      client = ClientBuilder.cluster().build();
    } else {
      // loading the out-of-cluster config, a kubeconfig from file-system
      String kubeConfigPath = System.getProperty("user.home") + "/.kube/config";
      client = ClientBuilder.kubeconfig(KubeConfig.loadKubeConfig(new FileReader(kubeConfigPath))).build();
    }

    // set the global default api-client to the in-cluster one from above
    Configuration.setDefaultApiClient(client);

    String scanName = System.getenv("SCAN_NAME");
    if (scanName == null) {
      scanName = "nmap-scanme.nmap.org";
    }
    String namespace = System.getenv("NAMESPACE");
    if (namespace == null) {
      namespace = "default";
    }

    // set the global default api-client to the in-cluster one from above
    Configuration.setDefaultApiClient(client);

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

  /**
   * Returns the rawResults (original security scanner results) of the given securityTests.
   *
   * @param scan The scan to return the rawResults for.
   * @return the rawResults (original security scanner results) of the given securityTests.
   * @throws DefectDojoPersistenceException If the raw
   */
  private String getRawResults(V1Scan scan) throws DefectDojoPersistenceException {
    RestTemplate restTemplate = new RestTemplate();

    try {
      ResponseEntity<String> response = restTemplate.getForEntity(scan.getStatus().getRawResultDownloadLink(), String.class);
      LOG.debug("Got Raw Results {}", response.getBody());
      return response.getBody();
    } catch (HttpClientErrorException e) {
      throw new DefectDojoPersistenceException("Failed to download Raw Findings", e);
    }
  }

  private long ensureProductTypeExistsForScan(V1Scan scan) {
    // Put newly created Products in productType Id 1 (Research & Development) if not otherwise specified
    long productTypeId = 1;
    // If a product-type was specified use the specified one
    if (scan.getMetadata().getAnnotations() != null && scan.getMetadata().getAnnotations().containsKey(SecureCodeBoxScanAnnotations.PRODUCT_TYPE.getLabel())) {
      var productTypeName = scan.getMetadata().getAnnotations().get(SecureCodeBoxScanAnnotations.PRODUCT_TYPE.getLabel());

      LOG.info("Looking for ID of ProductType '{}'", productTypeName);
      final String finalProductTypeName = productTypeName;
      var productType = defectDojoProductService.getProductType(productTypeName).orElseGet(() -> {
        LOG.info("ProductType '{}' didn't already exists creating now", productTypeName);
        return defectDojoProductService.createProductType(finalProductTypeName);
      });

      productTypeId = productType.getId();
      LOG.info("Using ProductType Id: {}", productTypeId);
    } else {
      LOG.info("Using default ProductType as no '{}' annotation was found on the scan", SecureCodeBoxScanAnnotations.PRODUCT_TYPE.getLabel());
    }

    return productTypeId;
  }

  private long ensureProductExistsForScan(V1Scan scan, long productTypeId) {
    String productName = scan.getMetadata().getName();
    // If the Scan was created via a scheduled scan, the Name of the ScheduledScan should be preferred to the scans name
    if (scan.getMetadata().getOwnerReferences() != null) {
      for (var ownerReference : scan.getMetadata().getOwnerReferences()) {
        if ("ScheduledScan".equals(ownerReference.getKind())) {
          productName = ownerReference.getName();
        }
      }
    }
    // If the Scan has a explicit product name referenced via a label, use the labelled product name
    if (scan.getMetadata().getAnnotations() != null && scan.getMetadata().getAnnotations().containsKey(SecureCodeBoxScanAnnotations.PRODUCT_NAME.getLabel())) {
      productName = scan.getMetadata().getAnnotations().get(SecureCodeBoxScanAnnotations.PRODUCT_NAME.getLabel());
    }

    String productDescription = " ";
    // If the Scan was created via a scheduled scan, the Name of the ScheduledScan should be preferred to the scans name
    if (scan.getMetadata().getAnnotations() != null && scan.getMetadata().getAnnotations().containsKey(SecureCodeBoxScanAnnotations.PRODUCT_DESCRIPTION.getLabel())) {
      productDescription = scan.getMetadata().getAnnotations().get(SecureCodeBoxScanAnnotations.PRODUCT_DESCRIPTION.getLabel());
    }

    List<String> tags = List.of();
    if (scan.getMetadata().getAnnotations() != null && scan.getMetadata().getAnnotations().containsKey(SecureCodeBoxScanAnnotations.PRODUCT_TAGS.getLabel())) {
      tags = Arrays.stream(scan.getMetadata().getAnnotations().get(SecureCodeBoxScanAnnotations.ENGAGEMENT_TAGS.getLabel()).split(","))
        .map(String::trim)
        .collect(Collectors.toList());
    }

    return defectDojoProductService.retrieveOrCreateProduct(productName, productTypeId, productDescription, tags);
  }

  private long createTest(V1Scan scan, long engagementId, long userId) {
    var startDate = Objects.requireNonNull(scan.getMetadata().getCreationTimestamp()).toString("yyyy-MM-dd HH:mm:ssZ");

    String endDate;
    if (scan.getStatus().getFinishedAt() != null) {
      endDate = scan.getStatus().getFinishedAt().toString("yyyy-MM-dd HH:mm:ssZ");
    } else {
      endDate = DateTime.now().toString("yyyy-MM-dd HH:mm:ssZ");
    }

    String version = null;
    if (scan.getMetadata().getAnnotations() != null) {
      version = scan.getMetadata().getAnnotations().get(SecureCodeBoxScanAnnotations.ENGAGEMENT_VERSION.getLabel());
    }

    var testPayload = new TestPayload();
    testPayload.setTitle(scan.getMetadata().getName());
    testPayload.setDescription(descriptionGenerator.generate(scan));
    testPayload.setTestType(ScanNameMapping.bySecureCodeBoxScanType(scan.getSpec().getScanType()).testType.id);
    testPayload.setTargetStart(startDate);
    testPayload.setTargetEnd(endDate);
    testPayload.setEngagement(engagementId);
    testPayload.setLead(userId);
    testPayload.setPercentComplete(100);
    testPayload.setVersion(version);

    return defectDojoTestService.createTest(testPayload).getId();
  }
}
