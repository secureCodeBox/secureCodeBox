package io.securecodebox.persistence.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductTypeResponse {
  @JsonProperty
  long id;

  @JsonProperty
  @NonNull
  String name;

  @JsonProperty("critical_product")
  boolean criticalProduct;

  @JsonProperty("key_product")
  boolean keyProduct;
}

