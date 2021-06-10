package io.securecodebox.persistence.mapping;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.securecodebox.persistence.models.DefectDojoImportFinding;
import io.securecodebox.persistence.models.SecureCodeBoxFinding;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URI;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class SecureCodeBoxFindingsToDefectDojoMapper {
  private static final Logger LOG = LoggerFactory.getLogger(SecureCodeBoxFindingsToDefectDojoMapper.class);
  private static final DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");

  public static String fromSecureCodeboxFindingsJson(String scbFindingsJson) throws IOException {
    LOG.debug("Converting SecureCodeBox Findings to DefectDojo Findings");
    ObjectMapper mapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    List<DefectDojoImportFinding> DefectDojoImportFindings = new ArrayList<>();
    List<SecureCodeBoxFinding> secureCodeBoxFindings = mapper.readValue(scbFindingsJson, new TypeReference<>() {});
    for (SecureCodeBoxFinding secureCodeBoxFinding : secureCodeBoxFindings){
        DefectDojoImportFindings.add(fromSecureCodeBoxFinding(secureCodeBoxFinding));
    }
    // create the result where the format has to be {"findings": [finding1, findings2, ...]}
    ObjectNode ddFindingJson = mapper.createObjectNode();
    ArrayNode arrayNode = mapper.valueToTree(DefectDojoImportFindings);
    ddFindingJson.putArray("findings").addAll(arrayNode);
    return ddFindingJson.toString();
  }

  protected static DefectDojoImportFinding fromSecureCodeBoxFinding(SecureCodeBoxFinding secureCodeBoxFinding){
    //set basic info
    DefectDojoImportFinding result = new DefectDojoImportFinding();
    result.setTitle(secureCodeBoxFinding.getName());
    result.setDescription(secureCodeBoxFinding.getDescription());
    result.setSeverity(capitalize(secureCodeBoxFinding.getSeverity().toString()));
    result.setUniqueIdFromTool(secureCodeBoxFinding.getId());

    //set finding date
    Instant instant;
    if (secureCodeBoxFinding.getTimestamp() != null) {
      instant = Instant.from(DateTimeFormatter.ISO_INSTANT.parse(secureCodeBoxFinding.getTimestamp()));
    }
    else {
      instant = Instant.now();
    }
    LocalDateTime localDateTime = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
    result.setDate(dtf.format(localDateTime));

    //set finding location
    try {
      URI.create(secureCodeBoxFinding.getLocation());
      result.setEndpoints(Collections.singletonList(secureCodeBoxFinding.getLocation()));
    } catch (IllegalArgumentException e) {
      LOG.info("location is not a valid uri", e);
    }
    return result;
  }

  private static String capitalize(String str) {
    if(str == null || str.isEmpty()) {
      return str;
    }

    return str.substring(0, 1).toUpperCase() + str.substring(1);
  }
}
