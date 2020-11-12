package io.securecodebox.persistence.defectdojo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.jsontype.TypeSerializer;
import io.securecodebox.persistence.defectdojo.models.product.Product;
import io.securecodebox.persistence.models.DefectDojoProduct;
import io.securecodebox.persistence.models.DefectDojoResponse;
import org.springframework.stereotype.Component;

@Component
public class ProductService extends GenericDefectDojoService<Product> {

  @Override
  protected String getUrlPath() {
    return "products";
  }

  @Override
  protected Class<Product> getModelClass() {
    return Product.class;
  }

  @Override
  protected DefectDojoResponse<Product> deserializeList(String response) throws JsonProcessingException {
    return this.objectMapper.readValue(response, new TypeReference<>(){});
  }
}
