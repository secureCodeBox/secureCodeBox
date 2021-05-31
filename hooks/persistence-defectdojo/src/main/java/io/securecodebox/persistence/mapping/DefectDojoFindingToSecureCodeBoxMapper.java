// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.mapping;

import io.securecodebox.persistence.defectdojo.config.DefectDojoConfig;
import io.securecodebox.persistence.defectdojo.models.Endpoint;
import io.securecodebox.persistence.defectdojo.service.EndpointService;
import io.securecodebox.persistence.models.Finding;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.UUID;

public class DefectDojoFindingToSecureCodeBoxMapper {

  DefectDojoConfig config;
  EndpointService endpointService;

  public DefectDojoFindingToSecureCodeBoxMapper(DefectDojoConfig config, EndpointService endpointService){
    this.config = config;
    this.endpointService = endpointService;
  }

  public Finding fromDefectDojoFining(io.securecodebox.persistence.defectdojo.models.Finding defectDojoFinding) {
    var finding = new Finding();

    finding.setId(UUID.randomUUID().toString());
    finding.setName(defectDojoFinding.getTitle());
    finding.setCategory("DefectDojo Imported Finding");
    finding.setDescription(defectDojoFinding.getDescription());

    var attributes = new HashMap<String, Object>();
    attributes.put("defectdojo.org/finding-id", defectDojoFinding.getId());
    attributes.put("defectdojo.org/finding-url", config.getUrl() + "/finding/" + defectDojoFinding.getId());
    attributes.put("defectdojo.org/test-id", defectDojoFinding.getTest());
    attributes.put("defectdojo.org/test-url", config.getUrl() + "/test/" + defectDojoFinding.getTest());

    attributes.put("duplicate", defectDojoFinding.getDuplicate());
    attributes.put("falsePositive", defectDojoFinding.getFalsePositive());
    finding.setAttributes(attributes);

    // Map DefectDojo Severities to secureCodeBox Severities
    switch (defectDojoFinding.getSeverity()) {
      case Critical:
      case High:
        finding.setSeverity(Finding.Severities.High);
        break;
      case Medium:
        finding.setSeverity(Finding.Severities.Medium);
        break;
      case Low:
        finding.setSeverity(Finding.Severities.Low);
        break;
      case Informational:
        finding.setSeverity(Finding.Severities.Informational);
        break;
    }

    if (defectDojoFinding.getEndpoints() == null || defectDojoFinding.getEndpoints().isEmpty()){
      finding.setLocation("unkown");
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
