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

import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import io.securecodebox.persistence.models.DefectDojoResponse;
import io.securecodebox.persistence.models.EngagementResponse;
import io.securecodebox.persistence.models.TestPayload;
import io.securecodebox.persistence.models.TestResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.Optional;

@Component
public class DefectDojoTestService {

    @Value("${securecodebox.persistence.defectdojo.url}")
    protected String defectDojoUrl;

    @Value("${securecodebox.persistence.defectdojo.auth.key}")
    protected String defectDojoApiKey;

    @Value("${securecodebox.persistence.defectdojo.auth.name}")
    protected String defectDojoDefaultUserName;

    protected static final String DATE_FORMAT = "yyyy-MM-dd";
    protected static final String DATE_TIME_FORMAT = "yyyy-MM-dd hh:m:ss";

    private static final Logger LOG = LoggerFactory.getLogger(DefectDojoTestService.class);

    Clock clock = Clock.systemDefaultZone();

    private String currentDate() {
        return LocalDate.now(clock).format(DateTimeFormatter.ofPattern(DATE_FORMAT));
    }

    private String currentDateTime() {
        return LocalDateTime.now(clock).format(DateTimeFormatter.ofPattern(DATE_TIME_FORMAT));
    }

    /**
     * TODO: move to a seperate connection class
     * @return The DefectDojo Authentication Header
     */
    private HttpHeaders getDefectDojoAuthorizationHeaders(){
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Token " + defectDojoApiKey);
        return headers;
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
        if(testName != null && !testName.isEmpty()) {
            builder.queryParam("testType", testName);
        }

        RestTemplate restTemplate = new RestTemplate();
        HttpEntity engagementRequest = new HttpEntity(getDefectDojoAuthorizationHeaders());

        ResponseEntity<DefectDojoResponse<TestResponse>> response = restTemplate.exchange(builder.toUriString(), HttpMethod.GET, engagementRequest, new ParameterizedTypeReference<DefectDojoResponse<TestResponse>>(){});

        Optional<Long> testResponseId = null;
        Optional<Long> latestTestResponseId = Optional.empty();
        for(TestResponse test : response.getBody().getResults()) {
            if(testName == null || (test.getTitle() != null && test.getTitle().equals(testName))) {
                testResponseId = Optional.of(test.getId());
            }
            if(!latestTestResponseId.isPresent() || latestTestResponseId.get() < test.getId()) {
                latestTestResponseId = Optional.of(test.getId());
            }

        }
        if(testResponseId != null) {
            return testResponseId;
        }

        if(response.getBody().getNext() != null) {
            return getTestIdByEngagementName(engagementId, testName, offset + 1);
        }
        LOG.info("Test with name '{}' not found, using latest.", testName);
        return latestTestResponseId;
    }

    /*
     * Be aware that using latest might results in "conflicting" "latest" in case a new test is added while requesting latest
     */
    public Optional<Long> getLatestTestIdByEngagementName(Optional<Long> optionalEngagementId, String engagementName, String productName, String testName, long offset) {
        if(!optionalEngagementId.isPresent()) {
            LOG.warn("engagementName with name '{}' not found.", engagementName);
            return Optional.empty();
        }

        Long engagementId = optionalEngagementId.get();
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(defectDojoUrl + "/api/v2/tests")
                .queryParam("engagement", Long.toString(engagementId))
                .queryParam("limit", Long.toString(50L))
                .queryParam("offset", Long.toString(offset));
        if(testName != null) builder.queryParam("testType", testName);

        RestTemplate restTemplate = new RestTemplate();
        HttpEntity engagementRequest = new HttpEntity(getDefectDojoAuthorizationHeaders());

        ResponseEntity<DefectDojoResponse<TestResponse>> response = restTemplate.exchange(builder.toUriString(), HttpMethod.GET, engagementRequest, new ParameterizedTypeReference<DefectDojoResponse<TestResponse>>(){});

        Optional<Long> testResponseId = null;
        for(TestResponse test : response.getBody().getResults()){
            if(!testResponseId.isPresent() || test.getId() > testResponseId.get()) {
                testResponseId = Optional.of(test.getId());
            }
        }

        if(response.getBody().getNext() != null){
            Optional<Long> subOptionalTestResponseId = getTestIdByEngagementName(engagementId, testName, offset + 1);
            if(!testResponseId.isPresent() ||
                    (subOptionalTestResponseId.isPresent()) &&
                            subOptionalTestResponseId.get() > testResponseId.get()
            ) {
                testResponseId = subOptionalTestResponseId;
            }
        }
        if(testResponseId.isPresent()) {
            return testResponseId;
        }

        LOG.warn("Test with name '{}' not found.", testName);
        return Optional.empty();
    }

    private EngagementResponse createTest(TestPayload testPayload) {
        RestTemplate restTemplate = new RestTemplate();

        HttpEntity<TestPayload> payload = new HttpEntity<>(testPayload, getDefectDojoAuthorizationHeaders());

        try {
            ResponseEntity<EngagementResponse> response = restTemplate.exchange(defectDojoUrl + "/api/v2/tests/", HttpMethod.POST, payload, EngagementResponse.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            LOG.warn("Failed to create Test for SecurityTest.", e);
            LOG.warn("Failure response body. {}", e.getResponseBodyAsString());
            throw new DefectDojoPersistenceException("Failed to create Test for SecurityTest", e);
        }
    }

    long getTestIdOrCreate(long engagementId, TestPayload testPayload, String testType) {
        return getTestIdByEngagementName(engagementId, testPayload.getTitle(), 0).orElseGet(() -> {
            testPayload.setEngagement(Long.toString(engagementId));
            testPayload.setTargetStart(currentDateTime());
            testPayload.setTargetEnd(currentDateTime());
            testPayload.setTestType(Integer.toString(TestPayload.getTestTypeIdForName(testType)));
            return createTest(testPayload).getId();
        });
    }
}
