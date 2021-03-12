package io.securecodebox.persistence.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * secureCodeCode Finding Format
 */
@Data
public class Finding {
  @JsonProperty("id")
  String Id;
  @JsonProperty("name")
  String Name;
  @JsonProperty("location")
  String Location;
  @JsonProperty("description")
  String Description;
  @JsonProperty("category")
  String Category;
  @JsonProperty("osi_layer")
  String OsiLayer;
  @JsonProperty("severity")
  Severities Severity;
  @JsonProperty("attributes")
  Map<String, Object> Attributes;

  public enum Severities {
    @JsonProperty("High")
    High,
    @JsonProperty("Medium")
    Medium,
    @JsonProperty("Low")
    Low,
    @JsonProperty("Informational")
    Informational
    ;
  }

  public static Finding fromDefectDojoFining(io.securecodebox.persistence.defectdojo.models.Finding defectDojoFinding) {
    var finding = new Finding();

    finding.Id = UUID.randomUUID().toString();
    finding.Name = defectDojoFinding.getTitle();
    finding.Category = "DefectDojo Imported Finding";
    finding.Location = "unkown";
    finding.Description = defectDojoFinding.getDescription();

    var attributes = new HashMap<String, Object>();
    attributes.put("defectdojo.org/finding-id", defectDojoFinding.getId());
    attributes.put("defectdojo.org/test-id", defectDojoFinding.getTest());

    attributes.put("duplicate", defectDojoFinding.getDuplicate());
    attributes.put("falsePositive", defectDojoFinding.getFalsePositive());
    finding.Attributes = attributes;

    // Map DefectDojo Severities to secureCodeBox Severities
    switch (defectDojoFinding.getSeverity()) {
      case Critical:
      case High:
        finding.Severity = Finding.Severities.High;
        break;
      case Medium:
        finding.Severity = Severities.Medium;
        break;
      case Low:
        finding.Severity = Severities.Low;
        break;
      case Informational:
        finding.Severity = Severities.Informational;
        break;
    }

    return finding;
  }
}
