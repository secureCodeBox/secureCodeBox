// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.mapping;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.models.SecureCodeBoxFinding;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZoneId;
import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

// Create one instance for the whole class instead for each method to reuse the genericTestFinding in all methods
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@ExtendWith(MockitoExtension.class)
class SecureCodeBoxFindingsToDefectDojoMapperTest {

  // test class
  private SecureCodeBoxFindingsToDefectDojoMapper scbToDdMapper;
  // test data
  private SecureCodeBoxFinding genericTestFinding;
  // Mock
  private PersistenceProviderConfig ppConfig;

  @BeforeAll
  public void init() {
    var name = "Name";
    var description = "Description";
    var id = "e18cdc5e-6b49-4346-b623-28a4e878e154";
    var parsedAt = "2020-04-15T12:27:28.153Z";
    var location = "ldap://[2001:db8::7]/c=GB?objectClass?one";
    var attributes = new HashMap<String, Object>();
    var subAttribute = new HashMap<>();
    subAttribute.put("sub_attribute", "1");
    attributes.put("attribute_1", subAttribute);
    attributes.put("attribute_2", "2");
    attributes.put("attribute_3", "3");
    genericTestFinding = SecureCodeBoxFinding.builder().name(name).description(description)
      .severity(SecureCodeBoxFinding.Severities.HIGH).id(id).location(location).attributes(attributes)
      .parsedAt(parsedAt).build();
    ppConfig = mock(PersistenceProviderConfig.class);
    // usually the default TimeZone on a machine is used to create the DefectDojo Dates. To ensure that the test
    // results are the same regardless of the machine the test runs on we assume UTC+0 for tests.
    when(ppConfig.getDefectDojoTimezoneId()).thenReturn(ZoneId.of("+0"));
    scbToDdMapper = new SecureCodeBoxFindingsToDefectDojoMapper(ppConfig);
  }

  @Test
  void correctlyParsesBasicFindingProperties() {
    var ddFinding = scbToDdMapper.fromSecureCodeBoxFinding(genericTestFinding);
    assertEquals(ddFinding.getTitle(), genericTestFinding.getName());
    assertEquals(ddFinding.getUniqueIdFromTool(), genericTestFinding.getId());
    assertEquals(ddFinding.getEndpoints().get(0), genericTestFinding.getLocation());
  }

  @Test
  void correctlyParsesSeverities() {
    var nullSeverityFinding = SecureCodeBoxFinding.builder().build();
    var infoSeverityFinding = SecureCodeBoxFinding.builder().severity(SecureCodeBoxFinding.Severities.INFORMATIONAL).build();
    var lowSeverityFinding = SecureCodeBoxFinding.builder().severity(SecureCodeBoxFinding.Severities.LOW).build();
    var mediumSeverityFinding = SecureCodeBoxFinding.builder().severity(SecureCodeBoxFinding.Severities.MEDIUM).build();
    var highSeverityFinding = SecureCodeBoxFinding.builder().severity((SecureCodeBoxFinding.Severities.HIGH)).build();
    assertEquals(scbToDdMapper.fromSecureCodeBoxFinding(nullSeverityFinding).getSeverity(), "Info");
    assertEquals(scbToDdMapper.fromSecureCodeBoxFinding(infoSeverityFinding).getSeverity(), "Info");
    assertEquals(scbToDdMapper.fromSecureCodeBoxFinding(lowSeverityFinding).getSeverity(), "Low");
    assertEquals(scbToDdMapper.fromSecureCodeBoxFinding(mediumSeverityFinding).getSeverity(), "Medium");
    assertEquals(scbToDdMapper.fromSecureCodeBoxFinding(highSeverityFinding).getSeverity(), "High");
  }

  @Test
  void correctlyParsesDate() {
    var ddFinding = scbToDdMapper.fromSecureCodeBoxFinding(genericTestFinding);
    assertEquals(ddFinding.getDate(), "2020-04-15");
    var dateTestFinding = SecureCodeBoxFinding.builder().parsedAt("2030-12-01T14:22:28Z").build();
    var dateTestResultFinding = scbToDdMapper.fromSecureCodeBoxFinding(dateTestFinding);
    assertEquals(dateTestResultFinding.getDate(), "2030-12-01");
  }

  @Test
  void correctlyParsesDescription() throws JsonProcessingException {
    var ddFinding = scbToDdMapper.fromSecureCodeBoxFinding(genericTestFinding);
    assertTrue(ddFinding.getDescription().startsWith(genericTestFinding.getDescription()));
    //Description should consist of the secureCodeBox description and attributes as JSON
    String attributesJson = ddFinding.getDescription().substring(genericTestFinding.getDescription().length() + 1);
    String expectedAttributeJson = "{\n" +
      "  \"attribute_1\" : {\n" +
      "    \"sub_attribute\" : \"1\"\n" +
      "  },\n" +
      "  \"attribute_2\" : \"2\",\n" +
      "  \"attribute_3\" : \"3\"\n" +
      "}";
    // We do not care how exactly the JSON looks as long as it is correct.
    ObjectMapper mapper = new ObjectMapper();
    assertEquals(mapper.readTree(expectedAttributeJson), mapper.readTree(attributesJson));
  }

  @Test
  void doesNotThrowUnexpectedExceptionOnEmptyFinding() {
    var emptyScbFinding = SecureCodeBoxFinding.builder().build();
    assertDoesNotThrow(() -> scbToDdMapper.fromSecureCodeBoxFinding(emptyScbFinding));
  }
}
