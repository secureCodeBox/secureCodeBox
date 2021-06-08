package io.securecodebox.persistence.mapping;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.securecodebox.persistence.models.SecureCodeBoxFinding;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

import static org.junit.jupiter.api.Assertions.assertEquals;


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
    assertEquals(mapper.readTree(result), mapper.readTree(expectedResult));
  }

  @Test
  public void correctlyParsesFindings() throws IOException {
    var name = "Name";
    var description = "Description";
    var severity = "High";
    var id = "123";
    var location = "ldap://[2001:db8::7]/c=GB?objectClass?one";
    var scbFinding = SecureCodeBoxFinding.builder().name(name).description(description)
      .severity(SecureCodeBoxFinding.Severities.High).id(id).location(location)
      .build();

    var ddFinding = SecureCodeBoxFindingsToDefectDojoMapper.fromSecureCodeBoxFinding(scbFinding);
    assertEquals(ddFinding.getTitle(), name);
    assertEquals(ddFinding.getDescription(),description);
    assertEquals(ddFinding.getSeverity(), severity);
    assertEquals(ddFinding.getUniqueIdFromTool(), id);
    assertEquals(ddFinding.getEndpoints().get(0), location);
  }
}
