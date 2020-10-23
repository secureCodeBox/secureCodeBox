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
package io.securecodebox.persistence.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.LinkedList;
import java.util.List;


@Data
public class TestPayload {
    @JsonProperty
    protected String title;

    @JsonProperty("target_start")
    protected String targetStart;

    @JsonProperty("target_end")
    protected String targetEnd;
    @JsonProperty
    protected List<String> tags = new LinkedList<>();

    @JsonProperty("test_type")
    protected String testType;

    @JsonProperty
    protected String engagement;    

    /**
     * 1 Development
     * 3 Production
     */
    @JsonProperty
    protected String environment = "1";

    /**
     * 
     * @return OWASP DefectDojo test type id, -1 in case it is not found
     */
    public static int getTestTypeIdForName(String name) {
        switch (name) {    
            case "Dependency Check Scan":
            return 18;
            default:
            return -1;
        }
    }
}
