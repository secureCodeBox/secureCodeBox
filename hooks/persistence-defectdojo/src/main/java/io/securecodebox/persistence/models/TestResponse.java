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

import java.util.List;

@Data
public class TestResponse {
  @JsonProperty
  protected long id;

  @JsonProperty
  protected List<String> tags;

  @JsonProperty("test_type_name")
  protected String testTypeName;

  @JsonProperty
  protected String title;

  @JsonProperty
  protected String description;

  @JsonProperty("target_start")
  protected String targetStart;

  @JsonProperty("target_end")
  protected String targetEnd;

  @JsonProperty("estimated_time")
  protected String estimatedTime;

  @JsonProperty("actual_time")
  protected String actualTime;

  @JsonProperty("percent_complete")
  protected long percentComplete;

  @JsonProperty
  protected String updated;

  @JsonProperty
  protected String created;

  @JsonProperty
  protected String version;

  @JsonProperty
  protected long engagement;

  @JsonProperty
  protected long lead;

  @JsonProperty("test_type")
  protected long testType;

  @JsonProperty
  protected long environment;

}
