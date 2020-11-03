package io.securecodebox.persistence.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NonNull;

@Data
public class ProductTypePayload {
  @JsonProperty
  @NonNull
  String name;

  @JsonProperty("critical_product")
  boolean criticalProduct;

  @JsonProperty("key_product")
  boolean keyProduct;
}
