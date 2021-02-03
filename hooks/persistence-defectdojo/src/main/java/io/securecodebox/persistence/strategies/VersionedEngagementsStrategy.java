package io.securecodebox.persistence.strategies;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.securecodebox.persistence.defectdojo.TestType;
import io.securecodebox.persistence.defectdojo.config.DefectDojoConfig;
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
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLConnection;
import java.util.List;
import java.util.Objects;

/**
 * VersionedEngagementsStrategy creates a new Engagement for every new version of the software.
 * If a engagement already exists for this version it'll reuse the engagement and append new tests for every scan until the version gets bumped.
 */
public class VersionedEngagementsStrategy implements Strategy {
  private static final Logger LOG = LoggerFactory.getLogger(VersionedEngagementsStrategy.class);

  private final DescriptionGenerator descriptionGenerator = new DescriptionGenerator();

  private ProductService productService;
  private ProductTypeService productTypeService;
  private UserService userService;
  private ToolTypeService toolTypeService;
  private ToolConfigService toolConfigService;
  private EngagementService engagementService;
  private TestService testService;
  private ImportScanService importScanService;

  private DefectDojoConfig config;

  public VersionedEngagementsStrategy() {}

  public void init(DefectDojoConfig defectDojoConfig) {
    this.productService = new ProductService(defectDojoConfig);
    this.productTypeService = new ProductTypeService(defectDojoConfig);
    this.userService = new UserService(defectDojoConfig);
    this.toolTypeService = new ToolTypeService(defectDojoConfig);
    this.toolConfigService = new ToolConfigService(defectDojoConfig);
    this.engagementService = new EngagementService(defectDojoConfig);
    this.testService = new TestService(defectDojoConfig);
    this.importScanService = new ImportScanService(defectDojoConfig);

    this.config = defectDojoConfig;
  }

  public void run(Scan scan) throws Exception {
    LOG.info("Checking if DefectDojo is reachable");
    checkConnection();
    LOG.info("DefectDojo is reachable");

    LOG.info("Getting DefectDojo User Id");
    var userId = userService.searchUnique(User.builder().username(this.config.getUsername()).build())
      .orElseThrow(() -> new DefectDojoPersistenceException("Failed to find user with name: '" + this.config.getUsername() + "'"))
      .getId();

    LOG.info("Running with DefectDojo User Id: {}", userId);

    long productTypeId = this.ensureProductTypeExistsForScan(scan);
    long productId = this.ensureProductExistsForScan(scan, productTypeId).getId();

    LOG.info("Looking for existing or creating new DefectDojo Engagement");
    long engagementId = this.createEngagement(scan, productId, userId).getId();
    LOG.info("Using Engagement with Id: {}", engagementId);

    LOG.info("Downloading Scan Report (RawResults)");
    String result = this.getRawResults(scan);
    LOG.info("Finished Downloading Scan Report (RawResults)");

    var testId = this.createTest(scan, engagementId, userId);

    LOG.info("Uploading Scan Report (RawResults) to DefectDojo");

    var scanMapping = ScanNameMapping.bySecureCodeBoxScanType(scan.getSpec().getScanType());

    importScanService.reimportScan(
      result,
      testId,
      userId,
      this.descriptionGenerator.currentDate(),
      scanMapping.scanType,
      scanMapping.testType
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

    final String SECURITY_TEST_SERVER_NAME = "secureCodeBox";
    final String SECURITY_TEST_SERVER_DESCRIPTION = "secureCodeBox is a kubernetes based, modularized toolchain for continuous security scans of your software project.";

    var securityTestOrchestrationEngine = toolTypeService.searchUnique(ToolType.builder().name(ToolTypeService.SECURITY_TEST_SERVER_NAME).build()).orElseGet(
      () -> toolTypeService.create(
        ToolType.builder()
          .name(ToolTypeService.SECURITY_TEST_SERVER_NAME)
          .description("Security Test Orchestration Engine")
          .build()
      )
    );

    var toolConfig = toolConfigService.searchUnique(
      ToolConfig.builder().name(SECURITY_TEST_SERVER_NAME).url("https://github.com/secureCodeBox").build()
    ).orElseGet(() -> {
      LOG.info("Creating secureCodeBox Tool Config");
      return toolConfigService.create(
        ToolConfig.builder()
          .toolType(securityTestOrchestrationEngine.getId())
          .name(SECURITY_TEST_SERVER_NAME)
          .description(SECURITY_TEST_SERVER_DESCRIPTION)
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
      .branch(version)
      .orchestrationEngine(toolConfig.getId())
      .targetStart(descriptionGenerator.currentDate())
      .targetEnd(descriptionGenerator.currentDate())
      .status(Engagement.Status.IN_PROGRESS)
      .build();

    return engagementService.searchUnique(Engagement.builder().product(productId).name(engagementName).version(version).build()).orElseGet(() -> {
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
      final URLConnection connection = new URL(this.config.getUrl()).openConnection();
      connection.connect();
    } catch (final Exception e) {
      throw new DefectDojoUnreachableException("Could not reach DefectDojo at '" + this.config.getUrl() + "'!");
    }
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
    var productTypeNameOptional = scan.getProductType();

    if (productTypeNameOptional.isEmpty()) {
      LOG.info("Using default ProductType as no '{}' annotation was found on the scan", Scan.SecureCodeBoxScanAnnotations.PRODUCT_TYPE.getLabel());
      return 1;
    }

    var productTypeName = productTypeNameOptional.get();

    LOG.info("Looking for ID of ProductType '{}'", productTypeName);

    var productType = productTypeService.searchUnique(ProductType.builder().name(productTypeName).build()).orElseGet(() -> {
      LOG.info("ProductType '{}' didn't already exists creating now", productTypeName);
      return productTypeService.create(ProductType.builder().name(productTypeName).build());
    });

    LOG.info("Using ProductType Id: {}", productType.getId());

    return productType.getId();
  }

  private Product ensureProductExistsForScan(Scan scan, long productTypeId) throws URISyntaxException, JsonProcessingException {
    String productName = this.getProductName(scan);
    String productDescription = scan.getProductDescription().orElse("Product was automatically created by the secureCodeBox DefectDojo integration");
    List<String> tags = scan.getProductTags().orElseGet(List::of);

    return productService.searchUnique(Product.builder().name(productName).productType(productTypeId).build()).orElseGet(() -> {
      LOG.info("Creating Product: '{}'", productName);
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

    TestType testType = ScanNameMapping.bySecureCodeBoxScanType(scan.getSpec().getScanType()).testType;
    var test = Test.builder()
      .title(scan.getMetadata().getName())
      .description(descriptionGenerator.generate(scan))
      .testType(testType.getId())
      .targetStart(startDate)
      .targetEnd(endDate)
      .engagement(engagementId)
      .lead(userId)
      .percentComplete(100L)
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

  protected String getEngagementsName(Scan scan) {
    return scan.getEngagementName().orElseGet(() -> scan.getMetadata().getName());
  }
}
