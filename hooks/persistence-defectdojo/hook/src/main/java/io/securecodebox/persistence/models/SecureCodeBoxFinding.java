// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * secureCodeCode Finding Format
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SecureCodeBoxFinding {
  @JsonProperty
  String id;
  @JsonProperty
  String name;
  @JsonProperty
  String location;
  @JsonProperty
  String description;
  @JsonProperty
  String category;
  @JsonProperty("osi_layer")
  String osiLayer;
  @JsonProperty
  Severities severity;
  @JsonProperty("parsed_at")
  String parsedAt;
  @JsonProperty("identified_at")
  String identifiedAt;
  @JsonProperty
  Map<String, Object> attributes;

  public enum Severities {
    HIGH,
    MEDIUM,
    LOW,
    INFORMATIONAL
    ;
  }
}
