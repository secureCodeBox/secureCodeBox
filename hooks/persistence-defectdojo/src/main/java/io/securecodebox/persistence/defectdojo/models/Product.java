package io.securecodebox.persistence.defectdojo.models;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Product extends DefectDojoModel {
  @JsonProperty
  Long id;

  @JsonProperty
  String name;

  @JsonProperty
  List<String> tags;

  @JsonProperty
  String description;

  @JsonProperty("findings_count")
  Long findingsCount;

  @JsonProperty("authorized_users")
  List<String> authorizedUsers;

  @JsonProperty("prod_type")
  Long productType;

  @Override
  public boolean equalsQueryString(Map<String, Object> queryParams) {
    if (queryParams.containsKey("id") && queryParams.get("id").equals(this.id)) {
      return true;
    }
    if (queryParams.containsKey("name") && queryParams.get("name").equals(this.name)) {
      return true;
    }

    return false;
  }
}
