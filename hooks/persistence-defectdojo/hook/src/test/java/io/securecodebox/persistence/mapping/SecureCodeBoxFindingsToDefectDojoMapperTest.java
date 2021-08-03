package io.securecodebox.persistence.mapping;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.securecodebox.persistence.models.SecureCodeBoxFinding;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.*;


@ExtendWith(MockitoExtension.class)
public class SecureCodeBoxFindingsToDefectDojoMapperTest {

  @Test
  public void yieldsCorrectResult() throws IOException {
    String ddFindingsPath = "kubehunter-dd-findings.json";
    String scbFindingsPath = "kubehunter-scb-findings.json";
    ClassLoader cl = getClass().getClassLoader();

    File ddFindingsFile = new File(cl.getResource(ddFindingsPath).getFile());
    File scbFindingsFile = new File(cl.getResource(scbFindingsPath).getFile());
    String expectedResult = new String(Files.readAllBytes(ddFindingsFile.toPath()));
    String scbFindingsContent = new String(Files.readAllBytes(scbFindingsFile.toPath()));
    String result = SecureCodeBoxFindingsToDefectDojoMapper.fromSecureCodeboxFindingsJson(scbFindingsContent);
    ObjectMapper mapper = new ObjectMapper();
    JsonNode actualJSON = mapper.readTree(result);
    JsonNode expectedJSON = mapper.readTree(expectedResult);
    assertNotNull(actualJSON);
    // if whitespaces should be ignored in strings, a Custom Comperator could be used
    // then the result and expected result would not have to match exactly.
    // see https://www.baeldung.com/jackson-compare-two-json-objects
    assertEquals(actualJSON, expectedJSON);
  }

  @Test
  public void correctlyParsesFindings() throws IOException {
    var name = "Name";
    var description = "Description";
    var severity = "HIGH";
    var id = "123";
    var parsedAt = "2020-04-15T12:27:28.153Z";
    var location = "ldap://[2001:db8::7]/c=GB?objectClass?one";
    var attributes = new HashMap<String, Object>();
    var subAttribute = new HashMap<>();
    subAttribute.put("sub_attribute", "1");
    attributes.put("attribute_1", subAttribute);
    attributes.put("attribute_2", "2");
    attributes.put("attribute_3", "3");
    var scbFinding = SecureCodeBoxFinding.builder().name(name).description(description)
      .severity(SecureCodeBoxFinding.Severities.HIGH).id(id).location(location).attributes(attributes)
      .parsedAt(parsedAt).build();

    var ddFinding = SecureCodeBoxFindingsToDefectDojoMapper.fromSecureCodeBoxFinding(scbFinding);
    assertEquals(ddFinding.getTitle(), name);
    assertEquals(ddFinding.getSeverity(), severity);
    assertEquals(ddFinding.getUniqueIdFromTool(), id);
    assertEquals(ddFinding.getEndpoints().get(0), location);
    assertTrue(ddFinding.getDescription().startsWith(description));
    //Description should consist of description and attributes as JSON
    String attributesJson = ddFinding.getDescription().substring(description.length() + 1);
    String expectedAttributeJson = "{\n" +
      "  \"attribute_1\" : {\n" +
      "    \"sub_attribute\" : \"1\"\n" +
      "  },\n" +
      "  \"attribute_2\" : \"2\",\n" +
      "  \"attribute_3\" : \"3\"\n" +
      "}";
    ObjectMapper mapper = new ObjectMapper();
    var actualJson = mapper.readTree(expectedAttributeJson);
    assertNotNull(actualJson);
    assertEquals(mapper.readTree(attributesJson), mapper.readTree(expectedAttributeJson));
  }

  @Test
  public void doesntThrowUnexpectedExceptionOnEmptyFinding() throws JsonProcessingException {
    var emptyScbFinding = SecureCodeBoxFinding.builder().build();
    var ddFinding = SecureCodeBoxFindingsToDefectDojoMapper.fromSecureCodeBoxFinding(emptyScbFinding);
    assertNull(ddFinding.getTitle());
    assertNull(ddFinding.getDescription());
  }
}
