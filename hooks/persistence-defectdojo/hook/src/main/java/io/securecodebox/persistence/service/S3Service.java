// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.securecodebox.persistence.models.SecureCodeBoxFinding;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.util.List;

public class S3Service {
  private static final Logger LOG = LoggerFactory.getLogger(S3Service.class);

  public void overwriteFindings(String url, List<SecureCodeBoxFinding> secureCodeBoxFindings) throws IOException, InterruptedException {
    ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
    var findingJson = mapper.writeValueAsString(secureCodeBoxFindings);

    LOG.info("Uploading Findings to S3");

    var request = java.net.http.HttpRequest
      .newBuilder()
      .uri(URI.create(url))
      .PUT(java.net.http.HttpRequest.BodyPublishers.ofString(findingJson))
      .build();

    HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.discarding());
  }

  public String downloadFile(String downloadUrl) throws IOException, InterruptedException {
    var request = java.net.http.HttpRequest
      .newBuilder()
      .uri(URI.create(downloadUrl))
      .build();

    var response = HttpClient.newHttpClient()
      .send(request, HttpResponse.BodyHandlers.ofString());

    return response.body();
  }
}
