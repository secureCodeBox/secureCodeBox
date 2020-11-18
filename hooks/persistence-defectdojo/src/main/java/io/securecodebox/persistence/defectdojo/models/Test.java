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
package io.securecodebox.persistence.defectdojo.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.LinkedList;
import java.util.List;
import java.util.Map;


@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Test extends DefectDojoModel {
  @JsonProperty
  Long id;

  @JsonProperty
  String title;

  @JsonProperty
  String description;

  @JsonProperty("target_start")
  String targetStart;

  @JsonProperty("target_end")
  String targetEnd;

  @JsonProperty
  @Builder.Default
  List<String> tags = new LinkedList<>();

  @JsonProperty("test_type")
  Long testType;

  @JsonProperty
  Long lead;

  @JsonProperty("percent_complete")
  Long percentComplete;

  @JsonProperty
  Long engagement;

  @JsonProperty
  String version;

  /**
   * 1 Development
   * 3 Production
   */
  @JsonProperty
  @Builder.Default
  Long environment = 1L;

  @Override
  public boolean equalsQueryString(Map<String, Object> queryParams) {
    if (queryParams.containsKey("id") && queryParams.get("id").equals(this.id)) {
      return true;
    }
    if (queryParams.containsKey("title") && queryParams.get("title").equals(this.title)) {
      return true;
    }
    if (queryParams.containsKey("engagement") && queryParams.get("engagement").equals(this.engagement)) {
      return true;
    }

    return false;
  }
}
