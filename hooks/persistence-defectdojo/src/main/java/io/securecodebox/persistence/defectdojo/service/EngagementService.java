package io.securecodebox.persistence.defectdojo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import io.securecodebox.persistence.defectdojo.models.DefectDojoResponse;
import io.securecodebox.persistence.defectdojo.models.Engagement;
import org.springframework.stereotype.Component;

@Component
public class EngagementService extends GenericDefectDojoService<Engagement> {
  @Override
  protected String getUrlPath() {
    return "engagements";
  }

  @Override
  protected Class<Engagement> getModelClass() {
    return Engagement.class;
  }

  @Override
  protected DefectDojoResponse<Engagement> deserializeList(String response) throws JsonProcessingException {
    return this.objectMapper.readValue(response, new TypeReference<>() {
    });
  }
}
