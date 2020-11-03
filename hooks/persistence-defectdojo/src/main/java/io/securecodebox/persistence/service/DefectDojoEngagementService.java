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
package io.securecodebox.persistence.service;

import io.securecodebox.models.V1Scan;
import io.securecodebox.persistence.exceptions.DefectDojoLoopException;
import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import io.securecodebox.persistence.models.*;
import io.securecodebox.persistence.util.DescriptionGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class DefectDojoEngagementService {

  private static final String DATE_FORMAT = "yyyy-MM-dd";
  protected static final String TIME_FORMAT = "dd.MM.yyyy HH:mm:ss";

  private static final String GIT_SERVER_NAME = "Git Server";
  private static final String BUILD_SERVER_NAME = "Build Server";
  private static final String SECURITY_TEST_SERVER_NAME = "Security Test Orchestration Engine";

  @Value("${securecodebox.persistence.defectdojo.url}")
  protected String defectDojoUrl;

  @Value("${securecodebox.persistence.defectdojo.auth.key}")
  protected String defectDojoApiKey;

  @Value("${securecodebox.persistence.defectdojo.auth.name}")
  protected String defectDojoDefaultUserName;

  private static final Logger LOG = LoggerFactory.getLogger(DefectDojoEngagementService.class);

  @Autowired
  private DefectDojoProductService defectDojoProductService;

  @Autowired
  private DefectDojoToolService defectDojoToolService;

  @Autowired
  private DescriptionGenerator descriptionGenerator;

  private Clock clock = Clock.systemDefaultZone();


  /**
   * Returns the current date as string based on the DATE_FORMAT.
   *
   * @return the current date as string based on the DATE_FORMAT.
   */
  public String currentDate() {
    return LocalDate.now(clock).format(DateTimeFormatter.ofPattern(DATE_FORMAT));
  }

  private String currentTime() {
    return LocalDateTime.now(clock).format(DateTimeFormatter.ofPattern(TIME_FORMAT));
  }

  public void setClock(Clock clock) {
    this.clock = clock;
  }

  /**
   * TODO: move to a seperate connection class
   *
   * @return The DefectDojo Authentication Header
   */
  private HttpHeaders getDefectDojoAuthorizationHeaders() {
    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "Token " + defectDojoApiKey);
    return headers;
  }

  /**
   * Creates a new DefectDojo engagement for the given securityTest.
   *
   * @param scan The Scan to crete an DefectDojo engagement for.
   * @return The newly created engagement.
   */
  public long createEngagement(V1Scan scan, Long productId, Long userId) {
    EngagementPayload engagementPayload = new EngagementPayload();
    assert scan.getMetadata() != null;

    String engagementName = scan.getMetadata().getName();
    if (scan.getMetadata().getAnnotations() != null && scan.getMetadata().getAnnotations().containsKey(SecureCodeBoxScanAnnotations.ENGAGEMENT_NAME.getLabel())) {
      engagementName = scan.getMetadata().getAnnotations().get(SecureCodeBoxScanAnnotations.ENGAGEMENT_NAME.getLabel());
    }

    engagementPayload.setProduct(productId);

    engagementPayload.setName(engagementName);

    engagementPayload.setLead(userId);
    engagementPayload.setDescription("");
//        engagementPayload.setBranch(securityTest.getMetaData().get(CommonMetaFields.SCB_BRANCH.name()));
//        engagementPayload.setBuildID(securityTest.getMetaData().get(CommonMetaFields.SCB_BUILD_ID.name()));
//        engagementPayload.setCommitHash(securityTest.getMetaData().get(CommonMetaFields.SCB_COMMIT_HASH.name()));
//        engagementPayload.setRepo(securityTest.getMetaData().get(CommonMetaFields.SCB_REPO.name()));
//        engagementPayload.setTracker(securityTest.getMetaData().get(CommonMetaFields.SCB_TRACKER.name()));
//
//        engagementPayload.setBuildServer(defectDojoToolService.retrieveOrCreateToolConfiguration(securityTest.getMetaData().get(CommonMetaFields.SCB_BUILD_SERVER.name()), BUILD_SERVER_NAME));
//        engagementPayload.setScmServer(defectDojoToolService.retrieveOrCreateToolConfiguration(securityTest.getMetaData().get(CommonMetaFields.SCB_SCM_SERVER.name()), GIT_SERVER_NAME));
    engagementPayload.setOrchestrationEngine(defectDojoToolService.retrieveOrCreateToolConfiguration("https://github.com/secureCodeBox", SECURITY_TEST_SERVER_NAME));

    engagementPayload.setTargetStart(currentDate());
    engagementPayload.setTargetEnd(currentDate());
    engagementPayload.setStatus(EngagementPayload.Status.IN_PROGRESS);

    if (scan.getMetadata().getAnnotations() != null && scan.getMetadata().getAnnotations().containsKey(SecureCodeBoxScanAnnotations.ENGAGEMENT_TAGS.getLabel())) {
      var tags = new LinkedList<>(
        Arrays.asList(scan.getMetadata().getAnnotations().get(SecureCodeBoxScanAnnotations.ENGAGEMENT_TAGS.getLabel()).split(","))
      ).stream()
        .map(String::trim)
        .collect(Collectors.toList());

      engagementPayload.getTags().addAll(tags);
    }

    String version = null;
    if (scan.getMetadata().getAnnotations() != null && scan.getMetadata().getAnnotations().containsKey(SecureCodeBoxScanAnnotations.ENGAGEMENT_VERSION.getLabel())) {
      version = scan.getMetadata().getAnnotations().get(SecureCodeBoxScanAnnotations.ENGAGEMENT_VERSION.getLabel());
      engagementPayload.setVersion(version);
    }

    return this.getEngagementIdByEngagementNameOrCreate(productId, engagementName, version, engagementPayload, userId);
  }

  /**
   * Creates a new DefectDojo Engagement for the given engagement details.
   *
   * @param engagementPayload The engangement to create
   * @return The created Engagement for the given engagement details.
   */
  public EngagementResponse createEngagement(EngagementPayload engagementPayload) {
    RestTemplate restTemplate = new RestTemplate();

    HttpEntity<EngagementPayload> payload = new HttpEntity<>(engagementPayload, getDefectDojoAuthorizationHeaders());

    try {
      ResponseEntity<EngagementResponse> response = restTemplate.exchange(defectDojoUrl + "/api/v2/engagements/", HttpMethod.POST, payload, EngagementResponse.class);
      return response.getBody();
    } catch (HttpClientErrorException e) {
      LOG.warn("Failed to create Engagement for SecurityTest.", e);
      LOG.warn("Failure response body. {}", e.getResponseBodyAsString());
      throw new DefectDojoPersistenceException("Failed to create Engagement for SecurityTest", e);
    }
  }

  public String generateDescription(V1Scan scan) {
    return this.descriptionGenerator.generate(scan);
  }

  /**
   * When DefectDojo >= 1.5.4 is used, testType can be given. Add testName in case DefectDojo >= 1.5.4 is used
   * Using testName for each branch leads to multiple issues in DefectDojo, so it is not recommended
   */
  private Optional<Long> getTestIdByEngagementName(long engagementId, String testName, long offset) {
    UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(defectDojoUrl + "/api/v2/tests")
      .queryParam("engagement", Long.toString(engagementId))
      .queryParam("limit", Long.toString(50L))
      .queryParam("offset", Long.toString(offset));
    if (testName != null && !testName.isEmpty()) {
      builder.queryParam("testType", testName);
    }

    RestTemplate restTemplate = new RestTemplate();
    HttpEntity engagementRequest = new HttpEntity(getDefectDojoAuthorizationHeaders());

    ResponseEntity<DefectDojoResponse<TestResponse>> response = restTemplate.exchange(builder.toUriString(), HttpMethod.GET, engagementRequest, new ParameterizedTypeReference<DefectDojoResponse<TestResponse>>() {
    });

    Optional<Long> testResponseId = Optional.empty();
    Optional<Long> latestTestResponseId = Optional.empty();
    for (TestResponse test : response.getBody().getResults()) {
      if (testName == null || (test.getTitle() != null && test.getTitle().equals(testName))) {
        testResponseId = Optional.of(test.getId());
      }
      if (!latestTestResponseId.isPresent() || latestTestResponseId.get() < test.getId()) {
        latestTestResponseId = Optional.of(test.getId());
      }

    }
    if (testResponseId.isPresent()) {
      return testResponseId;
    }

    if (response.getBody().getNext() != null) {
      return getTestIdByEngagementName(engagementId, testName, offset + 1);
    }
    LOG.info("Test with name '{}' not found, using latest.", testName);
    return latestTestResponseId;
  }

  public Optional<Long> getEngagementIdByEngagementName(String engagementName, long productId, String version) {
    UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(defectDojoUrl + "/api/v2/engagements/")
      .queryParam("product", Long.toString(productId))
      .queryParam("name", engagementName);

    if(version != null) {
      builder.queryParam("version", version);
    }

    RestTemplate restTemplate = new RestTemplate();
    HttpEntity engagementRequest = new HttpEntity(getDefectDojoAuthorizationHeaders());

    LOG.debug("Looking for engagements with url: '{}'", builder.toUriString());

    var engagementResponse = restTemplate.exchange(
      builder.build().toUri(),
      HttpMethod.GET,
      engagementRequest,
      new ParameterizedTypeReference<DefectDojoResponse<EngagementResponse>>() {}
    );

    LOG.debug("Got back a response ({}) of {} engagements", engagementResponse.getStatusCode(), engagementResponse.getBody().getCount());

    if (engagementResponse.getBody().getCount() > 0) {
      return Optional.of(engagementResponse.getBody().getResults().get(0).getId());
    }

    return Optional.empty();
  }

  public long getEngagementIdByEngagementNameOrCreate(long productId, String engagementName, EngagementPayload engagementPayload, long lead) {
    return getEngagementIdByEngagementName(engagementName, productId, null).orElseGet(() -> {
      engagementPayload.setName(engagementName);
      engagementPayload.setProduct(productId);
      engagementPayload.setTargetStart(currentDate());
      engagementPayload.setTargetEnd(currentDate());
      engagementPayload.setLead(lead);
      return createEngagement(engagementPayload).getId();
    });
  }

  public long getEngagementIdByEngagementNameOrCreate(long productId, String engagementName, String version, EngagementPayload engagementPayload, long lead) {
    return getEngagementIdByEngagementName(engagementName, productId, version).orElseGet(() -> {
      LOG.info("No Engagement found, creating one now.");
      engagementPayload.setName(engagementName);
      engagementPayload.setProduct(productId);
      engagementPayload.setTargetStart(currentDate());
      engagementPayload.setTargetEnd(currentDate());
      engagementPayload.setLead(lead);
      return createEngagement(engagementPayload).getId();
    });
  }

  public List<EngagementResponse> getEngagementsForProduct(long productId, long offset) throws DefectDojoLoopException {
    if (offset > 9999) {
      throw new DefectDojoLoopException("offset engagement products too much!");
    }
    UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(defectDojoUrl + "/api/v2/engagements")
      .queryParam("product", Long.toString(productId))
      .queryParam("limit", Long.toString(50L))
      .queryParam("offset", Long.toString(offset));

    RestTemplate restTemplate = new RestTemplate();
    HttpEntity engagementRequest = new HttpEntity(getDefectDojoAuthorizationHeaders());

    ResponseEntity<DefectDojoResponse<EngagementResponse>> engagementResponse = restTemplate.exchange(builder.toUriString(), HttpMethod.GET, engagementRequest, new ParameterizedTypeReference<DefectDojoResponse<EngagementResponse>>() {
    });
    List<EngagementResponse> engagementPayloads = new LinkedList<EngagementResponse>();
    engagementPayloads.addAll(engagementResponse.getBody().getResults());

    if (engagementResponse.getBody().getNext() != null) {
      engagementPayloads.addAll(getEngagementsForProduct(productId, offset + 1));
      ;
    }
    return engagementPayloads;
  }

  public void deleteEngagement(long engagementId) {
    RestTemplate restTemplate = new RestTemplate();

    String uri = defectDojoUrl + "/api/v2/engagements/" + engagementId + "/?id=" + engagementId;
    HttpEntity request = new HttpEntity(getDefectDojoAuthorizationHeaders());
    try {
      restTemplate.exchange(uri, HttpMethod.DELETE, request, DefectDojoResponse.class);
    } catch (HttpClientErrorException e) {
      LOG.warn("Failed to delete engagement, engagementId: " + engagementId, e);
      LOG.warn("Failure response body. {}", e.getResponseBodyAsString());
      throw new DefectDojoPersistenceException("Failed to delete product", e);
    }
  }

}
