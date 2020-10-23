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

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;


@Data
public class EngagementPayload {
    @JsonProperty
    protected String name;

    @JsonProperty
    protected long product;

    @JsonProperty("target_start")
    protected String targetStart;

    @JsonProperty("target_end")
    protected String targetEnd;

    @JsonProperty
    protected Long lead;

    @JsonProperty("engagement_type")
    protected String engagementType = "CI/CD";

    @JsonProperty
    protected Status status = Status.IN_PROGRESS;

    @JsonProperty
    protected List<String> tags = new LinkedList<>();

    @JsonProperty
    protected String tracker;

    @JsonProperty("build_id")
    protected String buildID;

    @JsonProperty("commit_hash")
    protected String commitHash;

    @JsonProperty("branch_tag")
    public String branch;

    @JsonProperty("source_code_management_uri")
    protected String repo;

    @JsonProperty("build_server")
    protected Long buildServer;

    @JsonProperty("source_code_management_server")
    protected Long scmServer;

    @JsonProperty("orchestration_engine")
    protected Long orchestrationEngine;

    @JsonProperty
    protected String description;

    @JsonProperty("deduplication_on_engagement")
    protected boolean deduplicationOnEngagement;

    /**
     * Currently only contains the statuses relevant to us.
     * If you need others, feel free to add them ;)
     */
    public static enum Status {
        @JsonProperty("Completed")
        COMPLETED,
        @JsonProperty("In Progress")
        IN_PROGRESS
    }
}
