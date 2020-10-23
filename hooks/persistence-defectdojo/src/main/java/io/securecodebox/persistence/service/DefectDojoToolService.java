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

import io.securecodebox.persistence.models.DefectDojoResponse;
import io.securecodebox.persistence.models.ToolConfig;
import io.securecodebox.persistence.models.ToolType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class DefectDojoToolService {

    private static final String GIT_SERVER_NAME = "Git Server";
    private static final String BUILD_SERVER_NAME = "Build Server";
    private static final String SECURITY_TEST_SERVER_NAME = "Security Test Orchestration Engine";

    @Value("${securecodebox.persistence.defectdojo.url}")
    protected String defectDojoUrl;

    @Value("${securecodebox.persistence.defectdojo.auth.key}")
    protected String defectDojoApiKey;

    @Value("${securecodebox.persistence.defectdojo.auth.name}")
    protected String defectDojoDefaultUserName;

    private static final Logger LOG = LoggerFactory.getLogger(DefectDojoToolService.class);

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
     * Creates Tool Types for GIT_SERVER_NAME, BUILD_SERVER_NAME, SECURITY_TEST_SERVER_NAME if they are not existing.
     */
    public void ensureToolTypesExistence() {
        DefectDojoResponse<ToolType> toolTypeGitResponse = getToolTypeByName(GIT_SERVER_NAME);
        if(toolTypeGitResponse.getCount() == 0) {
            createToolType(GIT_SERVER_NAME, "Source Code Management Server");
        }

        DefectDojoResponse<ToolType> toolTypeScmResponse = getToolTypeByName(BUILD_SERVER_NAME);
        if(toolTypeScmResponse.getCount() == 0) {
            createToolType(BUILD_SERVER_NAME, "Build Server responsible for starting Security Scan");
        }

        DefectDojoResponse<ToolType> toolTypeStoeResponse = getToolTypeByName(SECURITY_TEST_SERVER_NAME);
        if(toolTypeStoeResponse.getCount() == 0) {
            createToolType(SECURITY_TEST_SERVER_NAME, "Security Test Orchestration Engine");
        }
    }

    /**
     * Returns a DefectDojo ToolType based on the given ToolType name.
     * @param name The name to return the ToolType for.
     * @return a DefectDojo ToolType based on the given ToolType name.
     */
    public DefectDojoResponse<ToolType> getToolTypeByName(String name){
        RestTemplate restTemplate = new RestTemplate();
        HttpEntity toolTypeRequest = new HttpEntity(getDefectDojoAuthorizationHeaders());

        String uri = defectDojoUrl + "/api/v2/tool_types/?name=" + name;
        ResponseEntity<DefectDojoResponse<ToolType>> toolTypeResponse = restTemplate.exchange(uri, HttpMethod.GET, toolTypeRequest, new ParameterizedTypeReference<DefectDojoResponse<ToolType>>(){});

        return toolTypeResponse.getBody();
    }

    /**
     * Creates a new DefectDojo ToolType based on he given name and description.
     * @param name The name of the new DefectDojo ToolTyp to create.
     * @param description The description of the new DefectDojo ToolTyp to create.
     */
    public void createToolType(String name, String description){
        RestTemplate restTemplate = new RestTemplate();

        ToolType toolType = new ToolType();
        toolType.setName(name);
        toolType.setDescription(description);
        HttpEntity<ToolType> toolPayload = new HttpEntity<>(toolType, getDefectDojoAuthorizationHeaders());

        restTemplate.exchange(defectDojoUrl + "/api/v2/tool_types/", HttpMethod.POST, toolPayload, ToolType.class);
    }


    /**
     * Returns the corresponding toolConfigId for the given ToolConfig details.
     * It will be created automatically if not already existing.
     *
     * @param toolUrl The URL of the tool to return the id for.
     * @param toolType The type to the tool to return the id for.
     * @return The corresponding toolConfigId for the given ToolConfig details.
     */
    public Long retrieveOrCreateToolConfiguration(String toolUrl, String toolType) {
        if (toolUrl == null){
            return null;
        }

        ResponseEntity<DefectDojoResponse<ToolConfig>> toolResponse = retrieveToolConfiguration(toolUrl);

        LOG.debug(toolResponse.getBody().toString());

        if(toolResponse.getBody() != null && toolResponse.getBody().getCount() > 0){
            LOG.info("Tool configuration already exists. Returning existing configuration.");
        }
        else {
            LOG.info("Tool configuration does not exist yet. Creating new configuration.");
            createToolConfiguration(toolUrl, toolType);
        }
        return toolResponse.getBody().getResults().get(0).getId();
    }

    private ResponseEntity<DefectDojoResponse<ToolConfig>> retrieveToolConfiguration(String toolUrl) {
        RestTemplate restTemplate = new RestTemplate();
        String uri = defectDojoUrl + "/api/v2/tool_configurations/?name=" + toolUrl;
        HttpEntity toolRequest = new HttpEntity(getDefectDojoAuthorizationHeaders());

        return restTemplate.exchange(uri, HttpMethod.GET, toolRequest, new ParameterizedTypeReference<DefectDojoResponse<ToolConfig>>(){});
    }

    private void createToolConfiguration(String toolUrl, String toolType) {
        HttpEntity toolTypeRequest = new HttpEntity(getDefectDojoAuthorizationHeaders());
        String toolTypeRequestUri = defectDojoUrl + "/api/v2/tool_types/?name=" + toolType;
        RestTemplate restTemplate = new RestTemplate();

        ResponseEntity<DefectDojoResponse<ToolType>> toolTypeResponse = restTemplate.exchange(toolTypeRequestUri, HttpMethod.GET, toolTypeRequest, new ParameterizedTypeReference<DefectDojoResponse<ToolType>>(){});
        String toolTypeId = toolTypeResponse.getBody().getResults().get(0).getId();

        ToolConfig toolConfig = new ToolConfig();
        toolConfig.setName(toolUrl);
        toolConfig.setToolType(toolTypeId);
        toolConfig.setConfigUrl(toolUrl);
        toolConfig.setDescription(toolType);

        HttpEntity<ToolConfig> toolPayload = new HttpEntity<>(toolConfig, getDefectDojoAuthorizationHeaders());
        restTemplate.exchange(defectDojoUrl + "/api/v2/tool_configurations/", HttpMethod.POST, toolPayload, ToolConfig.class);
    }
}
