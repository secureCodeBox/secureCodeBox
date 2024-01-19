// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.service.scanresult;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.defectdojo.model.ScanFile;
import io.securecodebox.persistence.mapping.SecureCodeBoxFindingsToDefectDojoMapper;
import io.securecodebox.persistence.models.DefectDojoImportFinding;
import io.securecodebox.persistence.models.SecureCodeBoxFinding;
import io.securecodebox.persistence.service.S3Service;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;

import java.io.IOException;
import java.net.URL;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Responsible for returning scan results that are compatible with the DefectDojo Generic JSON Parser
 */
@Slf4j
public class GenericParserScanResultService extends ScanResultService {

  private static final ObjectMapper jsonObjectMapper = new ObjectMapper()
    .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false).findAndRegisterModules();

  public GenericParserScanResultService(S3Service s3Service) {
    super(s3Service);
  }

  /**
   * Fetches the secureCodeBox Findings.json file and converts it to a json file that is compatible with
   * the DefectDojo Generic JSON Parser. This result as a string is then returned together with a filename
   * in a ScanFile object. The ending of the filename is essential as it is evaluated by DefectDojo
   *
   * @param ppConfig config where the location of the scan result is specified
   */
  @Override
  public ScanFile getScanResult(PersistenceProviderConfig ppConfig) throws IOException, InterruptedException {
    log.debug("No explicit Parser specified. Using Findings JSON Scan Result");
    var scbToDdMapper = new SecureCodeBoxFindingsToDefectDojoMapper(ppConfig);
    var downloadUrl = ppConfig.getFindingDownloadUrl();
    var findingsJSON = s3Service.downloadFile(downloadUrl);
    List<SecureCodeBoxFinding> secureCodeBoxFindings = Arrays.asList(jsonObjectMapper.readValue(findingsJSON, SecureCodeBoxFinding[].class));
    List<DefectDojoImportFinding> defectDojoImportFindings = secureCodeBoxFindings.stream().map(scbToDdMapper::fromSecureCodeBoxFinding).collect(Collectors.toList());
    // for the generic defectDojo Parser the findings need to be wrapper in a json object called "findings"
    var defectDojoFindingJson = Collections.singletonMap("findings", defectDojoImportFindings);
    var scanResult = jsonObjectMapper.writeValueAsString(defectDojoFindingJson);
    return new ScanFile(scanResult, FilenameUtils.getName(new URL(downloadUrl).getPath()));
  }
}
