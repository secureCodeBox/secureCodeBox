package io.securecodebox.persistence.service;

import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.defectdojo.models.ScanFile;
import io.securecodebox.persistence.mapping.SecureCodeBoxFindingsToDefectDojoMapper;
import io.securecodebox.persistence.models.Scan;
import io.securecodebox.persistence.util.ScanNameMapping;
import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URL;

public class ScanService {
  private static final Logger LOG = LoggerFactory.getLogger(ScanService.class);

  public static ScanFile downloadScan(Scan scan, PersistenceProviderConfig ppConfig, S3Service s3Service) throws IOException, InterruptedException {
    String downloadUrl;
    String scanResults;
    String scanType = scan.getSpec().getScanType();
    ScanNameMapping scanNameMapping = ScanNameMapping.bySecureCodeBoxScanType(scanType);
    if (scanNameMapping == ScanNameMapping.GENERIC) {
      LOG.debug("No explicit Parser specified for ScanType {}, using Findings JSON Scan Result", scanType);
      downloadUrl = ppConfig.getFindingDownloadUrl();
      var findingsJSON = s3Service.downloadFile(downloadUrl);
      scanResults = SecureCodeBoxFindingsToDefectDojoMapper.fromSecureCodeboxFindingsJson(findingsJSON);
    } else {
      LOG.debug("Explicit Parser is specified for ScanType {}, using Raw Scan Result", scanNameMapping.scanType);
      downloadUrl = ppConfig.getRawResultDownloadUrl();
      scanResults = s3Service.downloadFile(downloadUrl);
    }
    LOG.info("Finished Downloading Scan Result");
    LOG.debug("Scan Result: {}", scanResults);

    return new ScanFile(scanResults, FilenameUtils.getName(new URL(downloadUrl).getPath()));
  }
}
