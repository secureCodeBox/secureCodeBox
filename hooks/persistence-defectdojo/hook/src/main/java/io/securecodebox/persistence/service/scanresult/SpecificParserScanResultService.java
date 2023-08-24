package io.securecodebox.persistence.service.scanresult;

import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.defectdojo.model.ScanFile;
import io.securecodebox.persistence.service.S3Service;
import org.apache.commons.io.FilenameUtils;

import java.io.IOException;
import java.net.URL;

/**
 * Responsible for returning the raw scan results produced by the secureCodeBox
 */
public class SpecificParserScanResultService extends ScanResultService {

  public SpecificParserScanResultService(S3Service s3Service) {
    super(s3Service);
  }

  /**
   * Fetches the secureCodeBox raw scan results and returns it together with the filename
   * in a ScanFile object. The ending of the filename is essential as it is evaluated by DefectDojo.
   * This is usually used when DefectDojo natively supports the scanner that produced the raw result.
   * @param ppConfig config where the location of the scan result is specified
   * @return
   * @throws IOException
   * @throws InterruptedException
   */
  @Override
  public ScanFile getScanResult(PersistenceProviderConfig ppConfig) throws IOException, InterruptedException {
    LOG.debug("Explicit Parser is specified. Using Raw Scan Result");
    var downloadUrl = ppConfig.getRawResultDownloadUrl();
    var scanResult = s3Service.downloadFile(downloadUrl);
    return new ScanFile(scanResult, FilenameUtils.getName(new URL(downloadUrl).getPath()));
  }
}
