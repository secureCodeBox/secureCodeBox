package io.securecodebox.persistence.defectdojo.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ToolConfig extends DefectDojoModel {
  @JsonProperty
  Long id;

  @JsonProperty
  String url;

  @JsonProperty
  @NonNull
  String name;

  @JsonProperty("tool_type")
  Long toolType;

  @JsonProperty("configuration_url")
  String configUrl;

  @JsonProperty
  String description;

  @Override
  public boolean equalsQueryString(Map<String, Object> queryParams) {
    if (queryParams.containsKey("id") && queryParams.get("id").equals(this.id)) {
      return true;
    }
    if (queryParams.containsKey("name") && queryParams.get("name").equals(this.name)) {
      return true;
    }
    if (queryParams.containsKey("configuration_url") && queryParams.get("configuration_url").equals(this.configUrl)) {
      return true;
    }

    return false;
  }
}
