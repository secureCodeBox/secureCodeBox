package io.securecodebox.persistence.service;

import io.securecodebox.models.V1ScanSpec;
import io.securecodebox.persistence.config.PersistenceProviderConfig;
import io.securecodebox.persistence.defectdojo.models.ScanFile;
import io.securecodebox.persistence.models.Scan;
import org.apache.log4j.LogMF;
import org.json.JSONException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.skyscreamer.jsonassert.JSONAssert;
import org.skyscreamer.jsonassert.JSONCompareMode;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class ScanServiceTest {
  @Mock
  S3Service s3Service;
  @Mock
  PersistenceProviderConfig ppConfig;
  @Mock
  Scan scan;

  private static String expectedDdFindingsString;
  private static String givenScbFindingsString;
  private static String rawNiktoScanString;

  @BeforeAll
  public static void init() throws IOException{
    expectedDdFindingsString = readResourceAsString("kubehunter-dd-findings.json");
    assertNotNull(expectedDdFindingsString);
    assertNotEquals(expectedDdFindingsString,"");
    givenScbFindingsString = readResourceAsString("kubehunter-scb-findings.json");
    assertNotNull(givenScbFindingsString);
    assertNotEquals(givenScbFindingsString,"");
    rawNiktoScanString = readResourceAsString("nikto-raw-result.json");
  }

  /***
   * When a unknown scanner is encountered the findings json has to be converted into defectdojo compatible json and
   * the correct file ending must be used so DefectDojo can choose the right parser (usually xml or json)
   * @throws IOException
   * @throws InterruptedException
   * @throws JSONException
   */
  @Test
  public void correctlyParsesGenericResults() throws IOException, InterruptedException, JSONException {
    String findingsUrl = "https://foo.com/findings.json";
    when(ppConfig.getFindingDownloadUrl()).thenReturn(findingsUrl);
    when(s3Service.downloadFile(findingsUrl)).thenReturn(givenScbFindingsString);
    V1ScanSpec scanSpec = new V1ScanSpec();
    scanSpec.setScanType("some-unknown-scanner-type");
    when(scan.getSpec()).thenReturn(scanSpec);
    ScanFile result = ScanService.getDefectDojoCompatibleScanResult(scan,ppConfig,s3Service);
    JSONAssert.assertEquals(expectedDdFindingsString,result.getContent(), JSONCompareMode.NON_EXTENSIBLE);
    assertTrue(result.getName().endsWith(".json"));
  }

  /***
   * When a known scanner like nikto is encountered the raw result must be passed and the correct file ending must
   * be used so DefectDojo can choose the right parser (usually xml or json)
   * @throws IOException
   * @throws InterruptedException
   */
  @Test
  public void correctlyReturnsScannerSpecificResults() throws IOException, InterruptedException {
    String rawResultDownloadUrl = "https://foo.com/nikto-raw-results.json";
    when(ppConfig.getRawResultDownloadUrl()).thenReturn(rawResultDownloadUrl);
    V1ScanSpec scanSpec = new V1ScanSpec();
    scanSpec.setScanType("nikto");
    when(scan.getSpec()).thenReturn(scanSpec);
    when(s3Service.downloadFile(rawResultDownloadUrl)).thenReturn(rawNiktoScanString);
    ScanFile result = ScanService.getDefectDojoCompatibleScanResult(scan,ppConfig,s3Service);
    assertEquals(rawNiktoScanString,result.getContent());
    assertTrue(result.getName().endsWith(".json"));
  }

  public static String readResourceAsString(String resourceName) throws IOException {
    ClassLoader cl = ScanServiceTest.class.getClassLoader();
    File resourceFile = new File(cl.getResource(resourceName).getFile());
    return Files.readString(resourceFile.toPath());
  }


}
