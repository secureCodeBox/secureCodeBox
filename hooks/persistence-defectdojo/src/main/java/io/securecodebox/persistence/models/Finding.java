package io.securecodebox.persistence.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * secureCodeCode Finding Format
 */
@Data
public class Finding {
  @JsonProperty("id")
  String Id;
  @JsonProperty("name")
  String Name;
  @JsonProperty("location")
  String Location;
  @JsonProperty("description")
  String Description;
  @JsonProperty("category")
  String Category;
  @JsonProperty("osi_layer")
  String OsiLayer;
  @JsonProperty("severity")
  Severities Severity;
  @JsonProperty("attributes")
  Map<String, Object> Attributes;

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
