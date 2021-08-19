package io.securecodebox.persistence.service.scanresult;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.defectdojo.models.ScanFile;
import io.securecodebox.persistence.mapping.SecureCodeBoxFindingsToDefectDojoMapper;
import io.securecodebox.persistence.models.DefectDojoImportFinding;
import io.securecodebox.persistence.models.SecureCodeBoxFinding;
import io.securecodebox.persistence.service.S3Service;
import org.apache.commons.io.FilenameUtils;

import java.io.IOException;
import java.net.URL;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class GenericParserScanResultService extends ScanResultService {

  private static final ObjectMapper jsonObjectMapper = new ObjectMapper()
    .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false).findAndRegisterModules();

  public GenericParserScanResultService(S3Service s3Service) {
    super(s3Service);
  }

  @Override
  public ScanFile getScanResult(PersistenceProviderConfig ppConfig) throws IOException, InterruptedException {
    LOG.debug("No explicit Parser specified using Findings JSON Scan Result");
    var scbToDdMapper = new SecureCodeBoxFindingsToDefectDojoMapper(ppConfig);
    var downloadUrl = ppConfig.getFindingDownloadUrl();
    var findingsJSON = s3Service.downloadFile(downloadUrl);
    List<SecureCodeBoxFinding> secureCodeBoxFindings = Arrays.asList(jsonObjectMapper.readValue(findingsJSON, SecureCodeBoxFinding[].class));
    List<DefectDojoImportFinding> defectDojoImportFindings = secureCodeBoxFindings.stream().map(scbToDdMapper::fromSecureCodeBoxFinding).collect(Collectors.toList());
    // for the generic defectDojo Parser the findings need to be wrapper in a json object called "findings"
    var defectDojoFindingJson = Collections.singletonMap("findings",defectDojoImportFindings);
    var scanResult = jsonObjectMapper.writeValueAsString(defectDojoFindingJson);
    return new ScanFile(scanResult, FilenameUtils.getName(new URL(downloadUrl).getPath()));
  }
}
