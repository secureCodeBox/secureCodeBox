package io.securecodebox.persistence.mapping;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.securecodebox.persistence.config.FindingMapperConfig;
import io.securecodebox.persistence.models.SecureCodeBoxFinding;
import org.json.JSONException;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.skyscreamer.jsonassert.JSONAssert;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.TimeZone;

import static org.junit.jupiter.api.Assertions.*;


@ExtendWith(MockitoExtension.class)
public class SecureCodeBoxFindingToDefectDojoMapperTest {
  ClassLoader cl = getClass().getClassLoader();
  SecureCodeBoxFindingToDefectDojoMapper findingMapper;

  public SecureCodeBoxFindingToDefectDojoMapperTest(){
    FindingMapperConfig mapperConfig = new FindingMapperConfig(TimeZone.getTimeZone(ZoneId.of("+0")));
    findingMapper = new SecureCodeBoxFindingToDefectDojoMapper(mapperConfig);
  }

  @Test
  public void yieldsCorrectResult() throws IOException, JSONException {
    String ddFindingsPath = "kubehunter-dd-findings.json";
    String scbFindingsPath = "kubehunter-scb-findings.json";
    String expectedDefectDojoFindings = readFileAsString(ddFindingsPath);
    String scbJsonString = readFileAsString(scbFindingsPath);
    String actualDefectDojoFindings = findingMapper.fromSecureCodeboxFindingsJson(scbJsonString);
    JSONAssert.assertEquals(expectedDefectDojoFindings, actualDefectDojoFindings,false);
  }

  @Test
  public void correctlyParsesFindings() throws IOException {
    var name = "Name";
    var description = "Description";
    var severity = "High";
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
    var ddFinding = findingMapper.fromSecureCodeBoxFinding(scbFinding);

    assertEquals(ddFinding.getTitle(), name);
    assertEquals(ddFinding.getSeverity(), severity);
    assertEquals(ddFinding.getUniqueIdFromTool(), id);
    assertEquals(ddFinding.getEndpoints().get(0), location);
    assertEquals(ddFinding.getDate(), "2020-04-15");
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
    var ddFinding = findingMapper.fromSecureCodeBoxFinding(emptyScbFinding);
    assertNull(ddFinding.getTitle());
    assertNull(ddFinding.getDescription());
  }

  public String readFileAsString(String fileName) throws IOException
  {
    Path filePath = Paths.get(cl.getResource(fileName).getPath());
    return new String(Files.readAllBytes(filePath));
  }
}
