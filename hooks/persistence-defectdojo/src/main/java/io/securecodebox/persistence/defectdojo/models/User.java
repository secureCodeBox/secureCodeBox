package io.securecodebox.persistence.defectdojo.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class User extends DefectDojoModel {
  @JsonProperty
  Long id;

  @JsonProperty
  @NonNull
  String username;

  @JsonProperty("first_name")
  String firstName;

  @JsonProperty("last_name")
  String lastName;

  @Override
  public boolean equalsQueryString(Map<String, Object> queryParams) {
    if (queryParams.containsKey("id") && queryParams.get("id").equals(this.id)) {
      return true;
    }
    if (queryParams.containsKey("username") && queryParams.get("username").equals(this.username)) {
      return true;
    }

    return false;
  }
}
