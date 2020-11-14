package io.securecodebox.persistence.defectdojo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import io.securecodebox.persistence.defectdojo.models.DefectDojoResponse;
import io.securecodebox.persistence.defectdojo.models.ToolConfig;
import org.springframework.stereotype.Component;

@Component
public class ToolConfigService extends GenericDefectDojoService<ToolConfig> {
  @Override
  protected String getUrlPath() {
    return "tool_configurations";
  }

  @Override
  protected Class<ToolConfig> getModelClass() {
    return ToolConfig.class;
  }

  @Override
  protected DefectDojoResponse<ToolConfig> deserializeList(String response) throws JsonProcessingException {
    return this.objectMapper.readValue(response, new TypeReference<>() {
    });
  }
}
