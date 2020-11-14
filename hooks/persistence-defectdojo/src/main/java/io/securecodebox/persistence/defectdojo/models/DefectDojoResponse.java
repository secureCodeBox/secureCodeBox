package io.securecodebox.persistence.defectdojo.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class DefectDojoResponse<T> {
  @JsonProperty
  int count;

  @JsonProperty
  String next;

  @JsonProperty
  String previous;

  @JsonProperty
  List<T> results;
}
