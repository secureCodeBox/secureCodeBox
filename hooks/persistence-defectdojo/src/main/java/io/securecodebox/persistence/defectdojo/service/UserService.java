package io.securecodebox.persistence.defectdojo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import io.securecodebox.persistence.defectdojo.models.DefectDojoResponse;
import io.securecodebox.persistence.defectdojo.models.User;
import org.springframework.stereotype.Component;

@Component
public class UserService extends GenericDefectDojoService<User> {
  @Override
  protected String getUrlPath() {
    return "users";
  }

  @Override
  protected Class<User> getModelClass() {
    return User.class;
  }

  @Override
  protected DefectDojoResponse<User> deserializeList(String response) throws JsonProcessingException {
    return this.objectMapper.readValue(response, new TypeReference<>() {
    });
  }
}
