package io.securecodebox.persistence.defectdojo.models.product;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.Map;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProductType extends DefectDojoModel {
  @JsonProperty
  long id;

  @JsonProperty
  @NonNull
  String name;

  @JsonProperty("critical_product")
  boolean criticalProduct;

  @JsonProperty("key_product")
  boolean keyProduct;

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
