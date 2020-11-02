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

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.ApiException;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.util.ClientBuilder;
import io.kubernetes.client.util.KubeConfig;
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
import java.util.Objects;

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
  private Environment environment;


  public static void main(String[] args) {
    SpringApplication.run(DefectDojoPersistenceProvider.class, args);
  }

  @Bean
  public CommandLineRunner commandLineRunner(ApplicationContext ctx) throws ApiException, IOException {
    return args -> {

      ApiClient client;

      if(Arrays.asList(environment.getActiveProfiles()).contains("prod")) {
        client = ClientBuilder.cluster().build();
      } else {
        // loading the out-of-cluster config, a kubeconfig from file-system
        String kubeConfigPath = System.getProperty("user.home") + "/.kube/config";

        System.out.println(kubeConfigPath);

        client = ClientBuilder.kubeconfig(KubeConfig.loadKubeConfig(new FileReader(kubeConfigPath))).build();
      }

      // set the global default api-client to the in-cluster one from above
      Configuration.setDefaultApiClient(client);

      String scanName = System.getenv("SCAN_NAME");
      if (scanName == null){
        scanName = "nmap-scanme.nmap.org";
      }
      String namespace = System.getenv("NAMESPACE");
      if (namespace == null){
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

      if(!response.isSuccess()) {
        throw new DefectDojoPersistenceException("Failed to fetch Scan '" + scanName + "' in Namespace '" + namespace + "' from Kubernetes API");
      }

      LOG.info("Fetched Scan from Kubernetes API");
      this.persist(response.getObject());
    };
  }

  /**
   * Persists the given securityTest within DefectDojo.
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
   * @param scan The securitTest to persist.
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

    LOG.info("Looking for existing or creating new DefectDojo Engagement");
    long engagementId = this.defectDojoEngagementService.createEngagement(scan, userId);
    LOG.info("Using Engagement with Id: '{}'", engagementId);

    LOG.info("Downloading Scan Report (RawResults)");
    String result = this.getRawResults(scan);
    LOG.info("Downloading Scan Report (RawResults)");

    var startDate = Objects.requireNonNull(scan.getMetadata().getCreationTimestamp()).toString("yyyy-MM-dd HH:mm:ssZ");
    LOG.info("Timestamp Test: '{}'", startDate);

    String endDate;
    if (scan.getStatus().getFinishedAt() != null) {
      endDate = scan.getStatus().getFinishedAt().toString("yyyy-MM-dd HH:mm:ssZ");
    } else {
      endDate = DateTime.now().toString("yyyy-MM-dd HH:mm:ssZ");
    }

    String version = null;
    if (scan.getMetadata().getAnnotations() != null ) {
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
    var test = defectDojoTestService.createTest(testPayload);

    LOG.info("Uploading Scan Report (RawResults) to DefectDojo");
    var ddTest= defectFindingService.createFindingsReImport(
      result,
      test.getId(),
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

  /**
   * Returns the rawResults (original security scanner results) of the given securityTests.
   *
   * @param scan The securityTest to return the rawResults for.
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
}
