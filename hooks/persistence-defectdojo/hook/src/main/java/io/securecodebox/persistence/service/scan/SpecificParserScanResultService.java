package io.securecodebox.persistence.service.scan;

import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.defectdojo.models.ScanFile;
import io.securecodebox.persistence.service.S3Service;
import org.apache.commons.io.FilenameUtils;

import java.io.IOException;
import java.net.URL;

public class SpecificParserScanResultService extends ScanResultService {

  public SpecificParserScanResultService(S3Service s3Service) {
    super(s3Service);
  }

  @Override
  public ScanFile getScanResult(PersistenceProviderConfig ppConfig) throws IOException, InterruptedException {
    LOG.debug("Explicit Parser is specified, using Raw Scan Result");
    var downloadUrl = ppConfig.getRawResultDownloadUrl();
    var scanResult = s3Service.downloadFile(downloadUrl);
    return new ScanFile(scanResult, FilenameUtils.getName(new URL(downloadUrl).getPath()));
  }
}
