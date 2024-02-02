// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence.strategies;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.kubernetes.client.openapi.models.V1OwnerReference;
import io.securecodebox.persistence.config.EnvConfig;
import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.defectdojo.config.Config;
import io.securecodebox.persistence.defectdojo.model.*;
import io.securecodebox.persistence.defectdojo.service.*;
import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import io.securecodebox.persistence.models.Scan;
import io.securecodebox.persistence.util.DescriptionGenerator;
import io.securecodebox.persistence.util.ScanNameMapping;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.map.LinkedMap;

import java.net.URISyntaxException;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * VersionedEngagementsStrategy creates a new Engagement for every new version of the software
 * <p>
 * If a engagement already exists for this version it'll reuse the engagement and append new tests for every scan until
 * the version gets bumped.
 * </p>
 */
@Slf4j
public class VersionedEngagementsStrategy implements Strategy {
  private final DescriptionGenerator descriptionGenerator = new DescriptionGenerator();

  ProductService productService;
  ProductTypeService productTypeService;
  UserService userService;
  UserProfileService userProfileService;
  ToolTypeService toolTypeService;
  ToolConfigService toolConfigService;
  EngagementService engagementService;
  TestService testService;
  TestTypeService testTypeService;
  ImportScanService importScanService;
  FindingService findingService;

  Config config;
  PersistenceProviderConfig persistenceProviderConfig;

  public VersionedEngagementsStrategy() {
    super();
  }

  @Override
  public void init(Config defectDojoConfig, PersistenceProviderConfig persistenceProviderConfig) {
    this.productService = new ProductService(defectDojoConfig);
    this.productTypeService = new ProductTypeService(defectDojoConfig);
    this.userService = new UserService(defectDojoConfig);
    this.userProfileService = new UserProfileService(defectDojoConfig);
    this.toolTypeService = new ToolTypeService(defectDojoConfig);
    this.toolConfigService = new ToolConfigService(defectDojoConfig);
    this.engagementService = new EngagementService(defectDojoConfig);
    this.testService = new TestService(defectDojoConfig);
    this.testTypeService = new TestTypeService(defectDojoConfig);
    this.importScanService = ImportScanService.createDefault(defectDojoConfig);
    this.findingService = new FindingService(defectDojoConfig);

    this.config = defectDojoConfig;
    this.persistenceProviderConfig = persistenceProviderConfig;
  }

  @Override
  public List<Finding> run(Scan scan, ScanFile scanResultFile) throws DefectDojoPersistenceException {
    log.debug("Getting DefectDojo User Id via user profile API");
    final List<UserProfile> userProfiles;

    try {
      userProfiles = userProfileService.search();
    } catch (URISyntaxException | JsonProcessingException e) {
      throw new DefectDojoPersistenceException(e.getMessage(), e);
    }

    final long userId;

    if (userProfiles.isEmpty()) {
      throw new DefectDojoPersistenceException("UserProfileService did return empty list. Expected current user to be in list");
    } else {
      userId = userProfiles.get(0).getUser().getId();
    }

    log.info("Running with DefectDojo User Id: {}", userId);
    final long productTypeId;
    final long productId;

    try {
      productTypeId = this.ensureProductTypeExistsForScan(scan);
      productId = this.ensureProductExistsForScan(scan, productTypeId).getId();
    } catch (URISyntaxException | JsonProcessingException e) {
      throw new DefectDojoPersistenceException(e.getMessage(), e);
    }

    log.debug("Looking for existing or creating new DefectDojo Engagement");
    final long engagementId;
    try {
      engagementId = this.createEngagement(scan, productId, userId).getId();
    } catch (URISyntaxException | JsonProcessingException e) {
      throw new DefectDojoPersistenceException(e.getMessage(), e);
    }
    log.debug("Using Engagement with Id: {}", engagementId);

    long testId;
    try {
      testId = this.createTest(scan, engagementId, userId);
    } catch (URISyntaxException | JsonProcessingException e) {
      throw new DefectDojoPersistenceException(e.getMessage(), e);
    }

    log.debug("Uploading Scan Report to DefectDojo");

    final var scanType = ScanNameMapping.bySecureCodeBoxScanType(scan.getSpec().getScanType()).scanType;
    final var searchObject = TestType.builder().name(scanType.getTestType()).build();
    final TestType testType;
    try {
      testType = testTypeService.searchUnique(searchObject)
        .orElseThrow(() -> {
          final var message = String.format(
            "Could not find test type '%s' in DefectDojo API. DefectDojo might be running in an unsupported version.",
            scanType.getTestType());
          return new DefectDojoPersistenceException(message);
        });
    } catch (URISyntaxException | JsonProcessingException e) {
      throw new DefectDojoPersistenceException(e.getMessage(), e);
    }

    final var additionalValues = new LinkedMap<String, String>();
    if (scan.getMinimumSeverity().isPresent()) {
      additionalValues.put("minimum-severity", scan.getMinimumSeverity().get());
    }

    importScanService.reimportScan(
      scanResultFile,
      testId,
      userId,
      this.descriptionGenerator.currentDate(),
      scanType,
      testType.getId(),
      additionalValues
    );

    log.info("Uploaded Scan Report as testID {} to DefectDojo", testId);

    waitUntilDeduplicationIsDone();

      try {
          return findingService.search(Map.of("test", String.valueOf(testId)));
      } catch (URISyntaxException | JsonProcessingException e) {
        throw new DefectDojoPersistenceException(e.getMessage(), e);
      }
  }

  /**
   * Creates a new DefectDojo engagement for the given securityTest.
   *
   * @param scan The Scan to crete an DefectDojo engagement for.
   * @return The newly created engagement.
   */
  public Engagement createEngagement(Scan scan, Long productId, Long userId) throws URISyntaxException, JsonProcessingException {
    String engagementName = this.getEngagementsName(scan);

    List<String> tags = scan.getEngagementTags().orElseGet(List::of);
    String version = scan.getEngagementVersion().orElse("");

    var engagementBuilder = Engagement.builder()
      .product(productId)
      .name(engagementName)
      .lead(userId)
      .description("")
      .tags(tags)
      .version(version)
      .branch(version)
      .targetStart(descriptionGenerator.currentDate())
      .targetEnd(descriptionGenerator.currentDate())
      .deduplicationOnEngagement(scan.getDeDuplicateOnEngagement().orElse(false))
      .status(Engagement.Status.IN_PROGRESS);

    if (!this.persistenceProviderConfig.isInLowPrivilegedMode()) {
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
        log.info("Creating secureCodeBox Tool Config");
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

      engagementBuilder.orchestrationEngine(toolConfig.getId());
    }

    var engagement = engagementBuilder.build();

    return engagementService.searchUnique(Engagement.builder().product(productId).name(engagementName).version(version).build()).orElseGet(() -> {
      log.info("Creating new Engagement as no matching Engagements could be found.");
      return engagementService.create(engagement);
    });
  }

  /**
   * Creates a new productType in DefectDojo if none exists already for the given scan.
   * If no productType is defined for the given scan a default productType will be used (productType Id = 1).
   *
   * @param scan The scan to ensure the DefectDojo productType for.
   * @return The productType Id already existing or newly created.
   * @throws URISyntaxException
   * @throws JsonProcessingException
   */
  private long ensureProductTypeExistsForScan(Scan scan) throws URISyntaxException, JsonProcessingException {
    var productTypeNameOptional = scan.getProductType();

    if (productTypeNameOptional.isEmpty()) {
      log.info("Using default ProductType as no '{}' annotation was found on the scan", Scan.SecureCodeBoxScanAnnotations.PRODUCT_TYPE.getLabel());
      return 1;
    }

    var productTypeName = productTypeNameOptional.get();

    log.info("Looking for ID of ProductType '{}'", productTypeName);

    var productType = productTypeService.searchUnique(ProductType.builder().name(productTypeName).build()).orElseGet(() -> {
      log.info("ProductType '{}' didn't already exists creating now", productTypeName);
      return productTypeService.create(ProductType.builder().name(productTypeName).build());
    });

    log.info("Using ProductType Id: {}", productType.getId());

    return productType.getId();
  }

  /**
   * Creates a new product in DefectDojo if none exists already related to the given scan and productType.
   *
   * @param scan          The scan to ensure the DefectDojo product for.
   * @param productTypeId The id of the productType.
   * @return The existing or newly created product releated to the given scan.
   * @throws URISyntaxException
   * @throws JsonProcessingException
   */
  private Product ensureProductExistsForScan(Scan scan, long productTypeId) throws URISyntaxException, JsonProcessingException {
    String productName = this.getProductName(scan);
    String productDescription = scan.getProductDescription().orElse("Product was automatically created by the secureCodeBox DefectDojo integration");
    List<String> tags = scan.getProductTags().orElseGet(List::of);

    return productService.searchUnique(Product.builder().name(productName).productType(productTypeId).build()).orElseGet(() -> {
      log.info("Creating Product: '{}'", productName);
      return productService.create(Product.builder()
        .name(productName)
        .description(productDescription)
        .productType(productTypeId)
        .tags(tags)
        .build()
      );
    });
  }

  /**
   * Creates a new test in DefectDojo related to the given scan and engagement.
   *
   * @param scan         The scan to create a new test in defectDojo for (related to the given engagement).
   * @param engagementId The engagement (referenced by id) to relate the new test to.
   * @param userId       The user id corresponding to create the test on behalf to.
   * @return The newly created test id.
   * @throws URISyntaxException
   * @throws JsonProcessingException
   */
  private long createTest(Scan scan, long engagementId, long userId) throws URISyntaxException, JsonProcessingException {
    var dateFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ssZ");

    var startDate = Objects.requireNonNull(scan.getMetadata().getCreationTimestamp()).format(dateFormat);

    // End date on the Scan Object isn't set when the DefectDojo Hook runs, best approximation of the end date is the current time.
    String endDate = ZonedDateTime.now().format(dateFormat);

    String version = scan.getEngagementVersion().orElse(null);

    String scanType = ScanNameMapping.bySecureCodeBoxScanType(scan.getSpec().getScanType()).scanType.getTestType();
    TestType testType = testTypeService.searchUnique(TestType.builder().name(scanType).build()).orElseThrow(() -> new DefectDojoPersistenceException("Could not find test type '" + scanType + "' in DefectDojo API. DefectDojo might be running in an unsupported version."));
    String testTitle = scan.getTestTitle().orElse(scan.getMetadata().getName());

    var test = Test.builder()
      .title(testTitle)
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

  /**
   * Returns the DefectDojo Product Name related to the given scan.
   *
   * @param scan The scan the productName relates to.
   * @return The productName related to the given scan.
   */
  protected String getProductName(Scan scan) {
    String result = "unknown";

    if (scan.getProductName().isPresent()) {
      result = scan.getProductName().get();
    } else if (scan.getMetadata().getOwnerReferences() != null) {
      // try to use the scheduledScan name if no productName is defined
      result = getProductNameForParentScan(scan.getMetadata().getOwnerReferences());
    } else {
      result = scan.getMetadata().getName();
    }

    return result;
  }

  /**
   * Returns the DefectDojo Product Name related to the given scan.
   * If the Scan was created via a scheduled scan, the Name of the ScheduledScan should be preferred to the scans name.
   *
   * @param ownerReferences The ownerReferences of the child Object.
   * @return The productName related to the given scan.
   */
  protected String getProductNameForParentScan(List<V1OwnerReference> ownerReferences) {
    String result = "";

    for (var ownerReference : ownerReferences) {
      if ("ScheduledScan".equals(ownerReference.getKind())) {
        result = ownerReference.getName();
      }
    }

    return result;
  }

  /**
   * Returns the DefectDojo Engagement Name related to the given scan.
   *
   * @param scan The scan the Engagement Name relates to.
   * @return the DefectDojo Engagement Name related to the given scan.
   */
  protected String getEngagementsName(Scan scan) {
    return scan.getEngagementName().orElseGet(() -> scan.getMetadata().getName());
  }

  /**
   * As a workaround we wait a configurable amount of time and block the execution
   * <p>
   * We hope that Defectdojo will provide an API in the future to check if the deduplication is done.
   * </p>
   */
  private static void waitUntilDeduplicationIsDone() {
    final var config = new EnvConfig();
    final var awaiter = new Awaiter(config.refetchWaitSeconds());
    log.info("Waiting for {} seconds for deduplication to finish before continuing", config.refetchWaitSeconds());
    awaiter.await();
  }
}
