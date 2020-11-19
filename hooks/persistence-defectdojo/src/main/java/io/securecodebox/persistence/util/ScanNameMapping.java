package io.securecodebox.persistence.util;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.securecodebox.persistence.defectdojo.ScanType;
import io.securecodebox.persistence.defectdojo.TestType;
import lombok.AllArgsConstructor;
import lombok.NonNull;

public enum ScanNameMapping {
  NMAP("nmap", ScanType.NMAP_SCAN, TestType.WEB_APPLICATION_TEST),
  ZAP_BASELINE("zap-baseline", ScanType.ZAP_SCAN, TestType.WEB_APPLICATION_TEST),
  ZAP_API_SCAN("zap-api-scan", ScanType.ZAP_SCAN, TestType.API_TEST),
  ZAP_FULL_SCAN("zap-full-scan", ScanType.ZAP_SCAN, TestType.WEB_APPLICATION_TEST),
  SSLYZE("sslyze", ScanType.SS_LYZE_3_SCAN_JSON, TestType.WEB_APPLICATION_TEST),
  ;

  /**
   * DefectDojo Scan Type
   * Example: "Nmap Scan"
   */
  public final ScanType scanType;
  /**
   * DefectDojo ToolType Id
   * Used to differentiate different Types of tools from another
   * <p>
   * Example
   */
  public final TestType testType;
  /**
   * secureCodeBox ScanType
   * Examples: "nmap", "zap-api-scan", "zap-baseline"
   */
  public final String scbScanType;

  ScanNameMapping(String scbScanType, ScanType scanType, TestType testType) {
    this.scbScanType = scbScanType;
    this.scanType = scanType;
    this.testType = testType;
  }

  public static ScanNameMapping bySecureCodeBoxScanType(@NonNull String scanType) {
    for (var mapping : ScanNameMapping.values()) {
      if (scanType.equals(mapping.scbScanType)) {
        return mapping;
      }
    }

    throw new IllegalArgumentException("No Mapping found for ScanType '" + scanType + "'");
  }
}
