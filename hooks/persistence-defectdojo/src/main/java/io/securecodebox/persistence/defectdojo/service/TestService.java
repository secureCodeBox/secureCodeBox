package io.securecodebox.persistence.defectdojo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import io.securecodebox.persistence.defectdojo.models.DefectDojoResponse;
import io.securecodebox.persistence.defectdojo.models.Test;
import org.springframework.stereotype.Component;

@Component
public class TestService extends GenericDefectDojoService<Test> {
  @Override
  protected String getUrlPath() {
    return "tests";
  }

  @Override
  protected Class<Test> getModelClass() {
    return Test.class;
  }

  @Override
  protected DefectDojoResponse<Test> deserializeList(String response) throws JsonProcessingException {
    return this.objectMapper.readValue(response, new TypeReference<>() {
    });
  }
}
