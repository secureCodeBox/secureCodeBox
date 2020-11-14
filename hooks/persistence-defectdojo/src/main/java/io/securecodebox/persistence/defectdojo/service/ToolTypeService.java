package io.securecodebox.persistence.defectdojo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import io.securecodebox.persistence.defectdojo.models.DefectDojoResponse;
import io.securecodebox.persistence.defectdojo.models.ToolType;
import org.springframework.stereotype.Component;

@Component
public class ToolTypeService extends GenericDefectDojoService<ToolType> {

  public static final String GIT_SERVER_NAME = "Git Server";
  public static final String BUILD_SERVER_NAME = "Build Server";
  public static final String SECURITY_TEST_SERVER_NAME = "Security Test Orchestration Engine";

  @Override
  protected String getUrlPath() {
    return "tool_types";
  }

  @Override
  protected Class<ToolType> getModelClass() {
    return ToolType.class;
  }

  @Override
  protected DefectDojoResponse<ToolType> deserializeList(String response) throws JsonProcessingException {
    return this.objectMapper.readValue(response, new TypeReference<>() {
    });
  }
}
