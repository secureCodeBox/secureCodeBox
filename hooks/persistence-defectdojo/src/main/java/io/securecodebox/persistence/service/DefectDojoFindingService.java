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
import io.securecodebox.persistence.models.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.http.converter.ResourceHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;

@Component
public class DefectDojoFindingService {

    @Value("${securecodebox.persistence.defectdojo.url}")
    protected String defectDojoUrl;

    @Value("${securecodebox.persistence.defectdojo.auth.key}")
    protected String defectDojoApiKey;

    @Value("${securecodebox.persistence.defectdojo.auth.name}")
    protected String defectDojoDefaultUserName;

    @Autowired
    private DefectDojoEngagementService defectDojoEngagementService;

    @Autowired
    private DefectDojoProductService defectDojoProductService;

    @Autowired
    private DefectDojoTestService defectDojoTestService;

    private static final Logger LOG = LoggerFactory.getLogger(DefectDojoFindingService.class);

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
     * Creates a new DefectDojo Finding based on the given findings details.
     * @param rawResult The security scanner rawResult to create in DefectDojo.
     * @param engagementId The corresponding engagementId this finding belongs to.
     * @param lead The lead
     * @param currentDate The current date
     * @param defectDojoScanName The defectDojo scanName which represents the scanner which produced the finding.
     * @return The DefectDojo response of the import process.
     */
    public ImportScanResponse createFindings(String rawResult, long engagementId, long lead, String currentDate, String defectDojoScanName) {
        return createFindings(rawResult, engagementId, lead, currentDate, defectDojoScanName, "", new LinkedMultiValueMap<>());
    }

    /**
     * Before version 1.5.4. testName (in DefectDojo _test_type_) must be defectDojoScanName, afterwards, you can have somethings else
     */
    public ImportScanResponse createFindings(String rawResult, long engagementId, long lead, String currentDate,String defectDojoScanName, String testName, MultiValueMap<String, Object> options) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = getDefectDojoAuthorizationHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        restTemplate.setMessageConverters(Arrays.asList(new FormHttpMessageConverter(), new ResourceHttpMessageConverter(), new MappingJackson2HttpMessageConverter()));

        MultiValueMap<String, Object> mvn = new LinkedMultiValueMap<>();
        mvn.add("engagement", Long.toString(engagementId));
        mvn.add("lead", Long.toString(lead));
        mvn.add("scan_date", currentDate);
        mvn.add("scan_type", defectDojoScanName);
        mvn.add("close_old_findings", "true");
        mvn.add("skip_duplicates", "false");

        if(!testName.isEmpty())
            mvn.add("test_type", testName);

        for (String theKey : options.keySet()) {
            mvn.remove(theKey);
        }
        mvn.addAll(options);

        try {
            ByteArrayResource contentsAsResource = new ByteArrayResource(rawResult.getBytes(StandardCharsets.UTF_8)) {
                @Override
                public String getFilename() {
                    return "this_needs_to_be_here_but_doesnt_really_matter.txt";
                }
            };

            mvn.add("file", contentsAsResource);

            HttpEntity<MultiValueMap> payload = new HttpEntity<>(mvn, headers);

            return restTemplate.exchange(defectDojoUrl + "/api/v2/import-scan/", HttpMethod.POST, payload, ImportScanResponse.class).getBody();
        } catch (HttpClientErrorException e) {
            LOG.warn("Failed to import findings to DefectDojo. Request failed with status code: '{}'.", e.getStatusCode());
            LOG.warn("Failure body: {}", e.getResponseBodyAsString());
            throw new DefectDojoPersistenceException("Failed to attach findings to engagement.");
        }
    }

    public ImportScanResponse createFindingsReImport(String rawResult, long testId, long lead, String currentDate,String defectDojoScanName, MultiValueMap<String, Object> options) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = getDefectDojoAuthorizationHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        restTemplate.setMessageConverters(Arrays.asList(new FormHttpMessageConverter(), new ResourceHttpMessageConverter(), new MappingJackson2HttpMessageConverter()));

        MultiValueMap<String, Object> mvn = new LinkedMultiValueMap<>();
        mvn.add("test", Long.toString(testId));
        mvn.add("lead", Long.toString(lead));
        mvn.add("scan_date", currentDate);
        mvn.add("scan_type", defectDojoScanName);
        mvn.add("close_old_findings", "true");
        mvn.add("skip_duplicates", "false");

        for (String theKey : options.keySet()) {
            if (mvn.containsKey(theKey)) {
                mvn.remove(theKey);
            }
        }
        mvn.addAll(options);

        try {
            ByteArrayResource contentsAsResource = new ByteArrayResource(rawResult.getBytes(StandardCharsets.UTF_8)) {
                @Override
                public String getFilename() {
                    return "this_needs_to_be_here_but_doesnt_really_matter.txt";
                }
            };

            mvn.add("file", contentsAsResource);

            HttpEntity<MultiValueMap> payload = new HttpEntity<>(mvn, headers);

            return restTemplate.exchange(defectDojoUrl + "/api/v2/reimport-scan/", HttpMethod.POST, payload, ImportScanResponse.class).getBody();
        } catch (HttpClientErrorException e) {
            LOG.warn("Failed to import findings to DefectDojo. Request failed with status code: '{}'.", e.getStatusCode());
            LOG.warn("Failure body: {}", e.getResponseBodyAsString());
            throw new DefectDojoPersistenceException("Failed to attach findings to engagement.");
        }
    }

    /* options is created as follows:
        MultiValueMap<String, String> mvn = new LinkedMultiValueMap<>();
        mvn.add("engagement", Long.toString(engagementId));
     */
    private List<Finding> getCurrentFindings(long engagementId, LinkedMultiValueMap<String, String> options){
        RestTemplate restTemplate = new RestTemplate();

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(defectDojoUrl + "/api/v2/findings/")
                .queryParam("active", "true")
                .queryParam("false_p", "false")
                .queryParam("duplicate", "false")
                .queryParam("test__engagement", Long.toString(engagementId));

        if(options != null) {
            builder = prepareParameters(options, builder);
        }

        HttpEntity request = new HttpEntity(getDefectDojoAuthorizationHeaders());
        try {
            ResponseEntity<DefectDojoResponse<Finding>> response = restTemplate.exchange(builder.toUriString(), HttpMethod.GET, request, new ParameterizedTypeReference<DefectDojoResponse<Finding>>(){});
            List<Finding> findings = new LinkedList<Finding>();
            for(Finding finding : response.getBody().getResults()){
                findings.add(finding);
            }
            return findings;
        } catch (HttpClientErrorException e) {
            LOG.warn("Failed to get findings for engagementId: {}", engagementId);
            LOG.warn("Failure response body. {}", e.getResponseBodyAsString());
            throw new DefectDojoPersistenceException("Failed to get findings", e);
        }
    }
    private UriComponentsBuilder prepareParameters(LinkedMultiValueMap<String, String> queryParameters, UriComponentsBuilder builder) {
        Iterator<String> it = queryParameters.keySet().iterator();

        while(it.hasNext()){
            String theKey = (String)it.next();
            builder.replaceQueryParam(theKey, queryParameters.getFirst(theKey));
        }
        return builder;
    }
}
