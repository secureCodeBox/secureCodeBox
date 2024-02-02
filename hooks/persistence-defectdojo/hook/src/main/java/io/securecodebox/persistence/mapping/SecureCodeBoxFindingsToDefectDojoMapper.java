// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.mapping;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.util.DefaultIndenter;
import com.fasterxml.jackson.core.util.DefaultPrettyPrinter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.models.DefectDojoImportFinding;
import io.securecodebox.persistence.models.SecureCodeBoxFinding;
import io.securecodebox.persistence.service.KubernetesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;

public class SecureCodeBoxFindingsToDefectDojoMapper {
  private static final Logger LOG = LoggerFactory.getLogger(KubernetesService.class);
  private final DateTimeFormatter ddDateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
  private final ObjectWriter attributeJsonPrinter = new ObjectMapper().writer(new DefaultPrettyPrinter()
    .withObjectIndenter(new DefaultIndenter().withLinefeed("\n")));
  private PersistenceProviderConfig ppConfig;

  public SecureCodeBoxFindingsToDefectDojoMapper(PersistenceProviderConfig ppConfig) {
    this.ppConfig = ppConfig;
  }

  protected String convertToDefectDojoSeverity(SecureCodeBoxFinding.Severities severity) {
    if (severity == null) {
      return "Info";
    }
    switch (severity) {
      case HIGH:
        return "High";
      case MEDIUM:
        return "Medium";
      case LOW:
        return "Low";
      case INFORMATIONAL:
        return "Info";
    }
    return "Info";
  }

  /**
   * Converts a SecureCodeBox Finding to a DefectDojo Finding,
   * that can be imported by the DefectDojo Generic JSON Parser.
   *
   * @param secureCodeBoxFinding Finding in SecureCodeBox format.
   * @return Finding in DefectDojo Format, compatible with the DefectDojo Generic JSON Parser
   */
  public DefectDojoImportFinding fromSecureCodeBoxFinding(SecureCodeBoxFinding secureCodeBoxFinding) {
    //set basic Finding info
    DefectDojoImportFinding result = new DefectDojoImportFinding();
    result.setTitle(secureCodeBoxFinding.getName());
    result.setSeverity(convertToDefectDojoSeverity(secureCodeBoxFinding.getSeverity()));
    result.setUniqueIdFromTool(secureCodeBoxFinding.getId());
    // set DefectDojo description as combination of SecureCodeBox Finding description and Finding attributes
    String description = secureCodeBoxFinding.getDescription();
    if (secureCodeBoxFinding.getAttributes() != null) {
      try {
        var attributesJson = attributeJsonPrinter.writeValueAsString(secureCodeBoxFinding.getAttributes());
        description = description + "\n " + attributesJson;
      } catch (JsonProcessingException e) {
        LOG.warn("Could not write the secureCodeBox Finding Attributes as JSON: ", e);
      }
    }
    result.setDescription(description);
    setFindingDate(secureCodeBoxFinding, result);
    setFindingLocation(secureCodeBoxFinding, result);
    return result;
  }

  private void setFindingLocation(SecureCodeBoxFinding secureCodeBoxFinding, DefectDojoImportFinding result) {
    if (secureCodeBoxFinding.getLocation() != null && !secureCodeBoxFinding.getLocation().isEmpty()) {
      try {
        URI.create(secureCodeBoxFinding.getLocation());
        result.setEndpoints(Collections.singletonList(secureCodeBoxFinding.getLocation()));
      } catch (IllegalArgumentException e) {
        LOG.warn("Couldn't parse the secureCodeBox location, because it: {} is not a vailid uri: {}", e, secureCodeBoxFinding.getLocation());
      }
    }
  }

  private void setFindingDate(SecureCodeBoxFinding secureCodeBoxFinding, DefectDojoImportFinding result) {
    Instant instant;
    if (secureCodeBoxFinding.getIdentifiedAt() != null && !secureCodeBoxFinding.getIdentifiedAt().isEmpty()) {
      instant = Instant.parse(secureCodeBoxFinding.getIdentifiedAt());
    } else if (secureCodeBoxFinding.getParsedAt() != null && !secureCodeBoxFinding.getParsedAt().isEmpty()) {
      instant = Instant.parse(secureCodeBoxFinding.getParsedAt());
    } else {
      instant = Instant.now();
    }
    LocalDateTime localDateTime = LocalDateTime.ofInstant(instant, ppConfig.getDefectDojoTimezoneId());
    result.setDate(ddDateFormatter.format(localDateTime));
  }
}
