// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.service.scanresult;

import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.defectdojo.model.ScanFile;
import io.securecodebox.persistence.models.Scan;
import io.securecodebox.persistence.service.S3Service;
import io.securecodebox.persistence.util.ScanNameMapping;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

/**
 * Abstract class that forces children to implement a method to get the scan results from a source
 * (e.g. download link) specified in the PersistenceProviderConfig.
 * It also builds the correct subclass to use, depending on the Scan (especially it's type)
 */
public abstract class ScanResultService {
  protected static final Logger LOG = LoggerFactory.getLogger(ScanResultService.class);
  protected S3Service s3Service;
  protected ScanResultService(S3Service s3Service) {
    this.s3Service = s3Service;
  }

  public static ScanResultService build(Scan scan, S3Service s3Service){
    ScanNameMapping scanNameMapping = ScanNameMapping.bySecureCodeBoxScanType(scan.getSpec().getScanType());
    if (scanNameMapping.equals(ScanNameMapping.GENERIC))
      return new GenericParserScanResultService(s3Service);
    else return new SpecificParserScanResultService(s3Service);
  }

  public abstract ScanFile getScanResult(PersistenceProviderConfig ppConfig) throws IOException, InterruptedException;
}
