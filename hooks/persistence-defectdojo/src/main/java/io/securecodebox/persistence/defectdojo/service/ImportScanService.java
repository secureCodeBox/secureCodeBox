package io.securecodebox.persistence.defectdojo.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import io.securecodebox.persistence.util.ScanNameMapping;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.http.converter.ResourceHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class ImportScanService {
  private static final Logger LOG = LoggerFactory.getLogger(GenericDefectDojoService.class);

  @Value("${securecodebox.persistence.defectdojo.url}")
  protected String defectDojoUrl;

  @Value("${securecodebox.persistence.defectdojo.auth.key}")
  protected String defectDojoApiKey;

  /**
   * TODO: move to a seperate connection class
   *
   * @return The DefectDojo Authentication Header
   */
  private HttpHeaders getDefectDojoAuthorizationHeaders() {
    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "Token " + defectDojoApiKey);
    return headers;
  }

  /**
   * Before version 1.5.4. testName (in DefectDojo _test_type_) must be defectDojoScanName, afterwards, you can have somethings else
   */
  protected ImportScanResponse createFindings(String rawResult, String endpoint, long lead, String currentDate, ScanNameMapping scanType, MultiValueMap<String, Object> options) {
    RestTemplate restTemplate = new RestTemplate();
    HttpHeaders headers = getDefectDojoAuthorizationHeaders();
    headers.setContentType(MediaType.MULTIPART_FORM_DATA);
    restTemplate.setMessageConverters(List.of(
      new FormHttpMessageConverter(),
      new ResourceHttpMessageConverter(),
      new MappingJackson2HttpMessageConverter())
    );

    MultiValueMap<String, Object> mvn = new LinkedMultiValueMap<>();

    mvn.add("lead", Long.toString(lead));
    mvn.add("scan_date", currentDate);
    mvn.add("scan_type", scanType.scanType);
    mvn.add("close_old_findings", "true");
    mvn.add("skip_duplicates", "false");

    if (scanType.testType != null)
      mvn.add("test_type", String.valueOf(scanType.testType.id));

    for (String theKey : options.keySet()) {
      mvn.remove(theKey);
    }
    mvn.addAll(options);

    try {
      ByteArrayResource contentsAsResource = new ByteArrayResource(rawResult.getBytes(StandardCharsets.UTF_8)) {
        @Override
        public String getFilename() {
          return "this_needs_to_be_here_but_doesnt_really_matter.txt";
        }
      };

      mvn.add("file", contentsAsResource);

      var payload = new HttpEntity<>(mvn, headers);

      return restTemplate.exchange(defectDojoUrl + "/api/v2/" + endpoint + "/", HttpMethod.POST, payload, ImportScanService.ImportScanResponse.class).getBody();
    } catch (HttpClientErrorException e) {
      LOG.warn("Failed to import findings to DefectDojo. Request failed with status code: '{}'.", e.getStatusCode());
      LOG.warn("Failure body: {}", e.getResponseBodyAsString());
      throw new DefectDojoPersistenceException("Failed to attach findings to engagement.");
    }
  }

  public ImportScanResponse importScan(String rawResults, long engagementId, long lead, String currentDate, ScanNameMapping scanType) {
    var additionalValues = new LinkedMultiValueMap<String, Object>();
    additionalValues.add("engagement", Long.toString(engagementId));

    return this.createFindings(rawResults, "import-scan", lead, currentDate, scanType, additionalValues);
  }

  public ImportScanResponse reimportScan(String rawResults, long testId, long lead, String currentDate, ScanNameMapping scanType) {
    var additionalValues = new LinkedMultiValueMap<String, Object>();
    additionalValues.add("test", Long.toString(testId));

    return this.createFindings(rawResults, "reimport-scan", lead, currentDate, scanType, additionalValues);
  }

  @Data
  public static class ImportScanResponse {
    @JsonProperty
    protected Boolean verified;

    @JsonProperty
    protected Boolean active;

    @JsonProperty("test")
    protected long testId;
  }
}
