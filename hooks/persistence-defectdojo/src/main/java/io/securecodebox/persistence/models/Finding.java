/*
 *
 *  SecureCodeBox (SCB)
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
package io.securecodebox.persistence.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;


@Data
public class Finding {
    @JsonProperty
    protected long id;

    @JsonProperty
    protected String title;
    
    @JsonProperty
    protected long cwe;

    @JsonProperty
    protected String cve;
    @JsonProperty

    protected String severity;
    
    @JsonProperty
    protected String description;
    
    @JsonProperty
    protected boolean active = true;
    
    @JsonProperty
    protected boolean verified = true;
    
    @JsonProperty("false_p")
    protected boolean falsePostive = false;
    
    @JsonProperty
    protected boolean duplicate =  false;

    @JsonProperty("is_Mitigated")
    protected boolean isMitigated = false;

    enum FindingSeverities {

    }
    public static final LinkedList<String> findingServerities = new LinkedList<String>(){{
        add("Informational");
        add("Low");
        add("Medium");
        add("High");
        add("Critical");
    }};
    public static LinkedList<String> getServeritiesAndHigherServerities(String minimumSeverity){
        LinkedList<String> severities = new LinkedList<String>();
        boolean minimumFound = false;
        for(String severity : findingServerities) {
            if(minimumFound || minimumSeverity.equals(severity)) {
                minimumFound = true;
                severities.add(severity);
            }
        }

        return severities;
    }
}