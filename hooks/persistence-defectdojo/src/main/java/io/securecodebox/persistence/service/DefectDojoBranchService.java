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

import io.securecodebox.persistence.models.EngagementResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DefectDojoBranchService {

    @Value("${securecodebox.persistence.defectdojo.url}")
    protected String defectDojoUrl;

    @Value("${securecodebox.persistence.defectdojo.auth.key}")
    protected String defectDojoApiKey;

    @Value("${securecodebox.persistence.defectdojo.auth.name}")
    protected String defectDojoDefaultUserName;

    @Autowired
    private DefectDojoProductService defectDojoProductService;

    @Autowired
    private DefectDojoEngagementService defectDojoEngagementService;

    private static final Logger LOG = LoggerFactory.getLogger(DefectDojoBranchService.class);

    /**
     * TODO: move to a seperate connection class
     * @return
     */
    private HttpHeaders getDefectDojoAuthorizationHeaders(){
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Token " + defectDojoApiKey);
        return headers;
    }


    public void deleteUnusedBranches(List<String> existingBranches, String producName) {
        long productId = defectDojoProductService.getProductId(producName);
        deleteUnusedBranches(existingBranches, productId);
    }

    /**
     * Deletes engagements based on branch tag
     * Be aware that the branch tag MUST be set, otherwise all engagments will be deleted
     */
    public void deleteUnusedBranches(List<String> existingBranches, long productId) {
        if(existingBranches == null) {
            LOG.error("No existing branches given, this will lead to nullpointer");
        }

        // get existing branches
        List<EngagementResponse> engagementPayloads = defectDojoEngagementService.getEngagementsForProduct(productId, 0);
        for(EngagementResponse engagementPayload : engagementPayloads) {
            boolean branchExists = false;
            assert existingBranches != null;
            for(String existingBranchName : existingBranches) {
                if(existingBranchName.equals(engagementPayload.getBranch())) {
                    branchExists = true;
                }
            }
            if(!branchExists) {
                defectDojoEngagementService.deleteEngagement(engagementPayload.getId());
                LOG.info("Deleted engagement with id " + engagementPayload.getId() + ", branch " + engagementPayload.getBranch());
            }
        }
    }
}
