/*
 *
 *  SecureCodeBox (SCB)
 *  Copyright 2015-2018 iteratec GmbH
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

import io.securecodebox.persistence.exceptions.DefectDojoUserNotFound;
import io.securecodebox.persistence.models.DefectDojoResponse;
import io.securecodebox.persistence.models.DefectDojoUser;
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

import java.text.MessageFormat;

@Component
public class DefectDojoUserService {

    @Value("${securecodebox.persistence.defectdojo.url}")
    public String defectDojoUrl;

    @Value("${securecodebox.persistence.defectdojo.auth.key}")
    protected String defectDojoApiKey;

    @Value("${securecodebox.persistence.defectdojo.auth.name}")
    protected String defectDojoDefaultUserName;

    private static final Logger LOG = LoggerFactory.getLogger(DefectDojoUserService.class);

    private HttpHeaders getDefectDojoAuthorizationHeaders(){
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Token " + defectDojoApiKey);
        return headers;
    }

    /**
     * Returns the DefectDojo UserId for the given Username if found, otherwise throws an DefectDojoUserNotFound exception.
     * @param username The username to return the username for.
     * @return The DefectDojo UserId for the given Username if found.
     * @throws DefectDojoUserNotFound If the username wasn't found or is not existing in DefectDojo.
     */
    public Long getUserId(String username) throws DefectDojoUserNotFound {
        RestTemplate restTemplate = new RestTemplate();

        if(username == null){
            username = defectDojoDefaultUserName;
        }

        String uri = defectDojoUrl + "/api/v2/users/?username=" + username;
        HttpEntity userRequest = new HttpEntity(getDefectDojoAuthorizationHeaders());
        ResponseEntity<DefectDojoResponse<DefectDojoUser>> userResponse = restTemplate.exchange(uri, HttpMethod.GET, userRequest, new ParameterizedTypeReference<DefectDojoResponse<DefectDojoUser>>(){});
        if(userResponse.getBody().getCount() == 1){
            return userResponse.getBody().getResults().get(0).getId();
        }
        else {
            throw new DefectDojoUserNotFound(MessageFormat.format("Could not find user: \"{0}\" in DefectDojo", username));
        }
    }
}
