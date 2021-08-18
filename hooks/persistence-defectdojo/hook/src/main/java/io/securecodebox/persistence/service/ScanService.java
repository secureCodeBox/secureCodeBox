package io.securecodebox.persistence.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.defectdojo.models.ScanFile;
import io.securecodebox.persistence.mapping.SecureCodeBoxFindingsToDefectDojoMapper;
import io.securecodebox.persistence.models.DefectDojoImportFinding;
import io.securecodebox.persistence.models.Scan;
import io.securecodebox.persistence.models.SecureCodeBoxFinding;
import io.securecodebox.persistence.util.ScanNameMapping;
import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URL;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class ScanService {
  private static final Logger LOG = LoggerFactory.getLogger(ScanService.class);
  private static final ObjectMapper jsonObjectMapper = new ObjectMapper()
    .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false).findAndRegisterModules();

  // gets the
  public static ScanFile getDefectDojoCompatibleScanResult(Scan scan, PersistenceProviderConfig ppConfig, S3Service s3Service) throws IOException, InterruptedException {
    String downloadUrl;
    String scanResult;
    String scanType = scan.getSpec().getScanType();
    ScanNameMapping scanNameMapping = ScanNameMapping.bySecureCodeBoxScanType(scanType);
    if (scanNameMapping == ScanNameMapping.GENERIC) {
      LOG.debug("No explicit Parser specified for ScanType {}, using Findings JSON Scan Result", scanType);
      var scbToDdMapper = new SecureCodeBoxFindingsToDefectDojoMapper();
      downloadUrl = ppConfig.getFindingDownloadUrl();
      var findingsJSON = s3Service.downloadFile(downloadUrl);
      List<SecureCodeBoxFinding> secureCodeBoxFindings = Arrays.asList(jsonObjectMapper.readValue(findingsJSON, SecureCodeBoxFinding[].class));
      List<DefectDojoImportFinding> defectDojoImportFindings = secureCodeBoxFindings.stream().map(scbToDdMapper::fromSecureCodeBoxFinding).collect(Collectors.toList());
      // for the generic defectDojo Parser the findings need to be wrapper in a json object called "findings"
      var defectDojoFindingJson = Collections.singletonMap("findings",defectDojoImportFindings);
      scanResult = jsonObjectMapper.writeValueAsString(defectDojoFindingJson);
    } else {
      LOG.debug("Explicit Parser is specified for ScanType {}, using Raw Scan Result", scanNameMapping.scanType);
      downloadUrl = ppConfig.getRawResultDownloadUrl();
      scanResult = s3Service.downloadFile(downloadUrl);
    }
    LOG.info("Finished Downloading Scan Result");
    LOG.debug("Scan Result: {}", scanResult);

    return new ScanFile(scanResult, FilenameUtils.getName(new URL(downloadUrl).getPath()));
  }
}
