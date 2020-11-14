package io.securecodebox.persistence.defectdojo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import io.securecodebox.persistence.defectdojo.models.DefectDojoResponse;
import io.securecodebox.persistence.defectdojo.models.Product;
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
    return this.objectMapper.readValue(response, new TypeReference<>() {
    });
  }
}
