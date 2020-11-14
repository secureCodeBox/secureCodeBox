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

import com.fasterxml.jackson.core.JsonProcessingException;
import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.util.ClientBuilder;
import io.kubernetes.client.util.KubeConfig;
import io.kubernetes.client.util.generic.GenericKubernetesApi;
import io.securecodebox.models.V1Scan;
import io.securecodebox.models.V1ScanList;
import io.securecodebox.persistence.defectdojo.models.*;
import io.securecodebox.persistence.defectdojo.service.*;
import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import io.securecodebox.persistence.exceptions.DefectDojoUnreachableException;
import io.securecodebox.persistence.models.Scan;
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
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.io.FileReader;
import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLConnection;
import java.util.*;

@SpringBootApplication
public class DefectDojoPersistenceProvider {
  private static final Logger LOG = LoggerFactory.getLogger(DefectDojoPersistenceProvider.class);

  @Value("${securecodebox.persistence.defectdojo.url}")
  protected String defectDojoUrl;

  @Value("${securecodebox.persistence.defectdojo.auth.name}")
  protected String defectDojoUser;

  @Autowired
  private DescriptionGenerator descriptionGenerator;

  @Autowired
  private Environment environment;

  @Autowired
  private ProductService productService;

  @Autowired
  private ProductTypeService productTypeService;

  @Autowired
  private UserService userService;

  @Autowired
  private ToolTypeService toolTypeService;

  @Autowired
  private ToolConfigService toolConfigService;

  @Autowired
  private EngagementService engagementService;

  @Autowired
  private TestService testService;

  @Autowired
  private ImportScanService importScanService;

  @Autowired
  private FindingService findingService;

  public static void main(String[] args) {
    SpringApplication.run(DefectDojoPersistenceProvider.class, args);
  }

  @Bean
  public CommandLineRunner commandLineRunner(ApplicationContext ctx) {
    return args -> {
      LOG.debug("Starting DefectDojo persistence provider");

      var scan = new Scan(getScanFromKubernetes());
      scan.validate();

      this.persist(scan);
    };
  }

  /**
   * Persists a given Scan within DefectDojo.
   *
   * @param scan The scan to persist.
   * @throws io.securecodebox.persistence.exceptions.DefectDojoPersistenceException If any persistence error occurs.
   */
  private void persist(Scan scan) throws DefectDojoPersistenceException, URISyntaxException, JsonProcessingException {
    LOG.info("Checking if DefectDojo is reachable");
    checkConnection();
    LOG.info("DefectDojo is reachable");

    LOG.info("Getting DefectDojo User Id");
    var userId = userService.searchUnique(Map.of("username", defectDojoUser))
      .orElseThrow(() -> new DefectDojoPersistenceException("Failed to find user with name: '" + defectDojoUser + "'"))
      .getId();

    LOG.info("Running with DefectDojo User Id: {}", userId);

    long productTypeId = this.ensureProductTypeExistsForScan(scan);
    long productId = this.ensureProductExistsForScan(scan, productTypeId).getId();

    LOG.info("Looking for existing or creating new DefectDojo Engagement");
    long engagementId = this.createEngagement(scan, productId, userId).getId();
    LOG.info("Using Engagement with Id: '{}'", engagementId);

    LOG.info("Downloading Scan Report (RawResults)");
    String result = this.getRawResults(scan);
    LOG.info("Finished Downloading Scan Report (RawResults)");

    var testId = this.createTest(scan, engagementId, userId);

    LOG.info("Uploading Scan Report (RawResults) to DefectDojo");

    importScanService.reimportScan(
      result,
      testId,
      userId,
      this.descriptionGenerator.currentDate(), ScanNameMapping.bySecureCodeBoxScanType(scan.getSpec().getScanType())
    );

    LOG.info("Uploaded Scan Report (RawResults) as testID {} to DefectDojo", testId);
    LOG.info("All done!");
  }

  /**
   * Creates a new DefectDojo engagement for the given securityTest.
   *
   * @param scan The Scan to crete an DefectDojo engagement for.
   * @return The newly created engagement.
   */
  public Engagement createEngagement(Scan scan, Long productId, Long userId) throws URISyntaxException, JsonProcessingException {
    String engagementName = this.getEngagementsName(scan);

    final String SECURITY_TEST_SERVER_NAME = "Security Test Orchestration Engine";
    var securityTestOrchestrationEngine = toolTypeService.searchUnique(Map.of("name", ToolTypeService.SECURITY_TEST_SERVER_NAME)).orElseGet(
      () -> toolTypeService.create(
        ToolType.builder()
          .name(ToolTypeService.SECURITY_TEST_SERVER_NAME)
          .description("Security Test Orchestration Engine")
          .build()
      )
    );

    var toolConfig = toolConfigService.searchUnique(
      Map.of("name", SECURITY_TEST_SERVER_NAME, "url", "https://github.com/secureCodeBox")
    ).orElseGet(() -> {
      LOG.info("Creating secureCodeBox Tool Config");
      return toolConfigService.create(
        ToolConfig.builder()
          .toolType(securityTestOrchestrationEngine.getId())
          .name("secureCodeBox")
          .url("https://github.com/secureCodeBox")
          .configUrl("https://github.com/secureCodeBox")
          .build()
      );
    });


    List<String> tags = scan.getEngagementTags().orElseGet(List::of);
    String version = scan.getEngagementVersion().orElse("");

    var engagement = Engagement.builder()
      .product(productId)
      .name(engagementName)
      .lead(userId)
      .description("")
      .tags(tags)
      .version(version)
      .orchestrationEngine(toolConfig.getId())
      .targetStart(descriptionGenerator.currentDate())
      .targetEnd(descriptionGenerator.currentDate())
      .status(Engagement.Status.IN_PROGRESS)
      .build();

    return engagementService.searchUnique(Map.of("product", productId, "name", engagementName, "version", version)).orElseGet(() -> {
      LOG.info("Creating new Engagement as no matching Engagements could be found.");
      return engagementService.create(engagement);
    });
  }

  /**
   * Checks if DefectDojo is available and reachable.
   *
   * @throws DefectDojoUnreachableException If DefectDojo is not reachable
   */
  public void checkConnection() throws DefectDojoUnreachableException {
    try {
      final URLConnection connection = new URL(this.defectDojoUrl).openConnection();
      connection.connect();
    } catch (final Exception e) {
      throw new DefectDojoUnreachableException("Could not reach defectdojo at '" + this.defectDojoUrl + "'!");
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
      scanName = "sslyze-securecodebox.io";
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
  private String getRawResults(Scan scan) throws DefectDojoPersistenceException {
    RestTemplate restTemplate = new RestTemplate();

    try {
      ResponseEntity<String> response = restTemplate.getForEntity(scan.getStatus().getRawResultDownloadLink(), String.class);
      LOG.debug("Got Raw Results {}", response.getBody());
      return response.getBody();
    } catch (HttpClientErrorException e) {
      throw new DefectDojoPersistenceException("Failed to download Raw Findings", e);
    }
  }

  private long ensureProductTypeExistsForScan(Scan scan) throws URISyntaxException, JsonProcessingException {
    var productTypeName = scan.getProductType();

    if(productTypeName.isEmpty()) {
      LOG.info("Using default ProductType as no '{}' annotation was found on the scan", Scan.SecureCodeBoxScanAnnotations.PRODUCT_TYPE.getLabel());
      return 1;
    }

    LOG.info("Looking for ID of ProductType '{}'", productTypeName);

    var productType = productTypeService.searchUnique(Map.of("name", productTypeName.get())).orElseGet(() -> {
      LOG.info("ProductType '{}' didn't already exists creating now", productTypeName.get());
      return productTypeService.create(ProductType.builder().name(productTypeName.get()).build());
    });

    LOG.info("Using ProductType Id: {}", productType.getId());

    return productType.getId();
  }

  private Product ensureProductExistsForScan(Scan scan, long productTypeId) throws URISyntaxException, JsonProcessingException {
    String productName = this.getProductName(scan);
    String productDescription = scan.getProductDescription().orElse("Product was automatically created by the secureCodeBox DefectDojo integration");
    List<String> tags = scan.getProductTags().orElseGet(List::of);

    return productService.searchUnique(Map.of("name", productName, "prod_type", productTypeId)).orElseGet(() -> {
      LOG.info("Creating Product");
      return productService.create(Product.builder()
        .name(productName)
        .description(productDescription)
        .productType(productTypeId)
        .tags(tags)
        .build()
      );
    });
  }

  private long createTest(Scan scan, long engagementId, long userId) {
    var startDate = Objects.requireNonNull(scan.getMetadata().getCreationTimestamp()).toString("yyyy-MM-dd HH:mm:ssZ");

    String endDate;
    if (scan.getStatus().getFinishedAt() != null) {
      endDate = scan.getStatus().getFinishedAt().toString("yyyy-MM-dd HH:mm:ssZ");
    } else {
      endDate = DateTime.now().toString("yyyy-MM-dd HH:mm:ssZ");
    }

    String version = scan.getEngagementVersion().orElse(null);

    var test = Test.builder()
      .title(scan.getMetadata().getName())
      .description(descriptionGenerator.generate(scan))
      .testType(ScanNameMapping.bySecureCodeBoxScanType(scan.getSpec().getScanType()).testType.id)
      .targetStart(startDate)
      .targetEnd(endDate)
      .engagement(engagementId)
      .lead(userId)
      .percentComplete(100)
      .version(version)
      .build();

    return testService.create(test).getId();
  }

  protected String getProductName(Scan scan) {
    if (scan.getProductName().isPresent()) {
      return scan.getProductName().get();
    }

    // If the Scan was created via a scheduled scan, the Name of the ScheduledScan should be preferred to the scans name
    if (scan.getMetadata().getOwnerReferences() != null) {
      for (var ownerReference : scan.getMetadata().getOwnerReferences()) {
        if ("ScheduledScan".equals(ownerReference.getKind())) {
          return ownerReference.getName();
        }
      }
    }

    return scan.getMetadata().getName();
  }

  protected String getEngagementsName(Scan scan){
    return scan.getEngagementName().orElseGet(() -> scan.getMetadata().getName());
  }
}
