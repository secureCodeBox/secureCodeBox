// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.models;

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
public class Finding {
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
  @JsonProperty
  Map<String, Object> attributes;

  public enum Severities {
    @JsonProperty("High")
    High,
    @JsonProperty("Medium")
    Medium,
    @JsonProperty("Low")
    Low,
    @JsonProperty("Informational")
    Informational
    ;
  }
}
