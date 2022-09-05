// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.mapping;

import io.securecodebox.persistence.defectdojo.config.DefectDojoConfig;
import io.securecodebox.persistence.defectdojo.models.Endpoint;
import io.securecodebox.persistence.defectdojo.service.EndpointService;
import io.securecodebox.persistence.defectdojo.service.FindingService;
import io.securecodebox.persistence.models.SecureCodeBoxFinding;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.UUID;

public class DefectDojoFindingToSecureCodeBoxMapper {

  DefectDojoConfig config;
  EndpointService endpointService;
  FindingService findingService;

  public DefectDojoFindingToSecureCodeBoxMapper(DefectDojoConfig config, EndpointService endpointService, FindingService findingService){
    this.config = config;
    this.endpointService = endpointService;
    this.findingService = findingService;
  }

  public SecureCodeBoxFinding fromDefectDojoFinding(io.securecodebox.persistence.defectdojo.models.Finding defectDojoFinding) {
    return fromDefectDojoFinding(defectDojoFinding, true);
  }

  public SecureCodeBoxFinding fromDefectDojoFinding(io.securecodebox.persistence.defectdojo.models.Finding defectDojoFinding, boolean recurse) {
    var finding = new SecureCodeBoxFinding();

    finding.setId(UUID.randomUUID().toString());
    finding.setName(defectDojoFinding.getTitle());
    finding.setCategory("DefectDojo Imported Finding");
    finding.setDescription(defectDojoFinding.getDescription());
    Instant createdAtInstant = defectDojoFinding.getCreatedAt().toInstant(OffsetDateTime.now().getOffset());
    finding.setParsedAt(DateTimeFormatter.ISO_INSTANT.format(createdAtInstant));

    var attributes = new HashMap<String, Object>();
    attributes.put("defectdojo.org/finding-id", defectDojoFinding.getId());
    attributes.put("defectdojo.org/finding-url", config.getUrl() + "/finding/" + defectDojoFinding.getId());
    attributes.put("defectdojo.org/test-id", defectDojoFinding.getTest());
    attributes.put("defectdojo.org/test-url", config.getUrl() + "/test/" + defectDojoFinding.getTest());

    attributes.put("duplicate", defectDojoFinding.getDuplicate());
    attributes.put("falsePositive", defectDojoFinding.getFalsePositive());
    attributes.put("riskAccepted", defectDojoFinding.getRiskAccepted());
    attributes.put("outOfScope", defectDojoFinding.getOutOfScope());

    if(defectDojoFinding.getDuplicate() && defectDojoFinding.getDuplicateFinding() != null) {
      if (!recurse) {
        throw new RuntimeException("Duplicate finding does not point to the actual original finding, as the original finding (id: " + defectDojoFinding.getId().toString() + ") is also a duplicate. This should never happen.");
      }
      var originalFinding = findingService.get(defectDojoFinding.getDuplicateFinding());

      attributes.put("defectdojo.org/original-finding-id", defectDojoFinding.getDuplicateFinding());
      attributes.put("defectdojo.org/original-finding", this.fromDefectDojoFinding(originalFinding, false));
    } else {
      attributes.put("defectdojo.org/original-finding-id", null);
      attributes.put("defectdojo.org/original-finding", null);
    }

    finding.setAttributes(attributes);

    // Map DefectDojo Severities to secureCodeBox Severities
    switch (defectDojoFinding.getSeverity()) {
      case Critical:
      case High:
        finding.setSeverity(SecureCodeBoxFinding.Severities.HIGH);
        break;
      case Medium:
        finding.setSeverity(SecureCodeBoxFinding.Severities.MEDIUM);
        break;
      case Low:
        finding.setSeverity(SecureCodeBoxFinding.Severities.LOW);
        break;
      case Informational:
        finding.setSeverity(SecureCodeBoxFinding.Severities.INFORMATIONAL);
        break;
    }

    if (defectDojoFinding.getEndpoints() == null || defectDojoFinding.getEndpoints().isEmpty()){
      finding.setLocation("unknown");
    } else {
      var endpoint = endpointService.get(defectDojoFinding.getEndpoints().get(0));
      finding.setLocation(stringifyEndpoint(endpoint));
    }

    return finding;
  }

  static String stringifyEndpoint(Endpoint endpoint) {
    var uriBuilder = UriComponentsBuilder.newInstance();

    if(endpoint.getProtocol() != null) {
      uriBuilder.scheme(endpoint.getProtocol());
    }
    if(endpoint.getHost() != null) {
      uriBuilder.host(endpoint.getHost());
    }
    if(endpoint.getPort() != null) {
      uriBuilder.port(endpoint.getPort().intValue());
    }
    if(endpoint.getPath() != null) {
      uriBuilder.path(endpoint.getPath());
    }
    if(endpoint.getQuery() != null) {
      uriBuilder.query(endpoint.getQuery());
    }

    return uriBuilder.build().toString();
  }
}
