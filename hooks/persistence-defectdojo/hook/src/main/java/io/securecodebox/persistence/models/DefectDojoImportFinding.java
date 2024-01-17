// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.models;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DefectDojo JSON Import Format
 * It is used to generate JSON that can be read by the DefectDojo Generic JSON Parser
 */
@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DefectDojoImportFinding {

  @JsonProperty
  String title;

  @JsonProperty
  String description;

  @JsonProperty
  Boolean active;

  @JsonProperty
  String created;

  @JsonProperty()
  Boolean verified;

  @JsonProperty
  String severity;

  @JsonProperty
  String impact;

  @JsonProperty
  String date;

  @JsonProperty
  String cve;

  @JsonProperty
  Integer cwe;

  @JsonProperty
  String cvssv3;

  @JsonProperty
  List<String> tags;

  @JsonProperty("unique_id_from_tool")
  String uniqueIdFromTool;

  @JsonProperty("vuln_id_from_tool")
  String vulnIdFromTool;

  @JsonProperty("endpoints")
  List<String> endpoints;

}
