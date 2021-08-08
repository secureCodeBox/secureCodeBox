package io.securecodebox.persistence.mapping;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.securecodebox.persistence.models.DefectDojoImportFinding;
import io.securecodebox.persistence.models.SecureCodeBoxFinding;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URI;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class SecureCodeBoxFindingsToDefectDojoMapper {
  private static final Logger LOG = LoggerFactory.getLogger(SecureCodeBoxFindingsToDefectDojoMapper.class);
  private static final DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
  private static final ObjectWriter prettyJSONPrinter = new ObjectMapper().writerWithDefaultPrettyPrinter();

  /**
   * Converts a SecureCodeBox Findings JSON String to a DefectDojo Findings JSON String.
   *
   * @param scbFindingsJson SecureCodeBox Findings JSON File as String
   * @return DefectDojo Findings JSON File as String, compatible with the DefectDojo Generic JSON Parser
   * @throws IOException
   */
  public static String fromSecureCodeboxFindingsJson(String scbFindingsJson) throws IOException {
    LOG.debug("Converting SecureCodeBox Findings to DefectDojo Findings");
    ObjectMapper mapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    List<DefectDojoImportFinding> DefectDojoImportFindings = new ArrayList<>();
    List<SecureCodeBoxFinding> secureCodeBoxFindings = mapper.readValue(scbFindingsJson, new TypeReference<>() {
    });
    for (SecureCodeBoxFinding secureCodeBoxFinding : secureCodeBoxFindings) {
      DefectDojoImportFindings.add(fromSecureCodeBoxFinding(secureCodeBoxFinding));
    }
    // create the result where the format has to be {"findings": [finding1, findings2, ...]}
    ObjectNode ddFindingJson = mapper.createObjectNode();
    ArrayNode arrayNode = mapper.valueToTree(DefectDojoImportFindings);
    ddFindingJson.putArray("findings").addAll(arrayNode);
    return ddFindingJson.toString();
  }

  /**
   * Converts a SecureCodeBox Finding to a DefectDojo Finding,
   * that can be imported by the DefectDojo Generic JSON Parser.
   *
   * @param secureCodeBoxFinding Finding in SecureCodeBox format.
   * @return Finding in DefectDojo Format, compatible with the DefectDojo Generic JSON Parser
   * @throws JsonProcessingException
   */
  protected static DefectDojoImportFinding fromSecureCodeBoxFinding(SecureCodeBoxFinding secureCodeBoxFinding) throws JsonProcessingException {
    //set basic Finding info
    DefectDojoImportFinding result = new DefectDojoImportFinding();
    result.setTitle(secureCodeBoxFinding.getName());
    if (secureCodeBoxFinding.getSeverity() != null)
      result.setSeverity(capitalize(secureCodeBoxFinding.getSeverity().toString()));
    result.setUniqueIdFromTool(secureCodeBoxFinding.getId());
    // set DefectDojo description as combination of SecureCodeBox Finding description and Finding attributes
    String description = secureCodeBoxFinding.getDescription();
    if (secureCodeBoxFinding.getAttributes() != null) {
      String attributesJson = prettyJSONPrinter.writeValueAsString(secureCodeBoxFinding.getAttributes());
      description = description + "\n " + attributesJson;
    }
    result.setDescription(description);
    setFindingDate(secureCodeBoxFinding, result);
    setFindingLocation(secureCodeBoxFinding, result);
    return result;
  }

  private static void setFindingLocation(SecureCodeBoxFinding secureCodeBoxFinding, DefectDojoImportFinding result) {
    if (secureCodeBoxFinding.getLocation() != null && !secureCodeBoxFinding.getLocation().isEmpty()) {
      try {
        URI.create(secureCodeBoxFinding.getLocation());
        result.setEndpoints(Collections.singletonList(secureCodeBoxFinding.getLocation()));
      } catch (IllegalArgumentException e) {
        LOG.warn("Couldn't parse the secureCodeBox location, because it: {} is not a vailid uri: {}", e, secureCodeBoxFinding.getLocation());
      }
    }
  }

  private static void setFindingDate(SecureCodeBoxFinding secureCodeBoxFinding, DefectDojoImportFinding result) {
    Instant instant = null;
    if (secureCodeBoxFinding.getIdentifiedAt() != null && !secureCodeBoxFinding.getIdentifiedAt().isEmpty()) {
      instant = Instant.parse(secureCodeBoxFinding.getIdentifiedAt());
    } else if (secureCodeBoxFinding.getParsedAt() != null && !secureCodeBoxFinding.getParsedAt().isEmpty()){
      instant = Instant.parse(secureCodeBoxFinding.getParsedAt());
    }
    else {
      instant = Instant.now();
    }
    LocalDateTime localDateTime = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
    result.setDate(dtf.format(localDateTime));
  }

  private static String capitalize(String str) {
    if (str == null || str.isEmpty()) {
      return str;
    }

    return str.substring(0, 1).toUpperCase() + str.substring(1);
  }
}
