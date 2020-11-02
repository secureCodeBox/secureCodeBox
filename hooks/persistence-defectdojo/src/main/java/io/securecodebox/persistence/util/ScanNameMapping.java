package io.securecodebox.persistence.util;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.NonNull;

@AllArgsConstructor
public enum ScanNameMapping {
  NMAP("nmap", "Nmap Scan", TestType.WEB_APPLICATION_TEST),
  ZAP_BASELINE("zap-baseline", "ZAP Scan", TestType.WEB_APPLICATION_TEST),
  ZAP_API_SCAN("zap-api-scan", "ZAP Scan", TestType.API_TEST),
  ZAP_FULL_SCAN("zap-full-scan", "ZAP Scan", TestType.WEB_APPLICATION_TEST),
  SSLYZE("sslyze", "SSLyze 3 Scan (JSON)", TestType.WEB_APPLICATION_TEST),
  ;

  /**
   * secureCodeBox ScanType
   * Examples: "nmap", "zap-api-scan", "zap-baseline"
   */
  protected String scbScanType;


  public static ScanNameMapping bySecureCodeBoxScanType(@NonNull String scanType) {
    for (var mapping : ScanNameMapping.values()) {
      if (scanType.equals(mapping.scbScanType)) {
        return mapping;
      }
    }

    throw new IllegalArgumentException("No Mapping found for ScanType '" + scanType + "'");
  }

  /**
   * DefectDojo Scan Type
   * Example: "Nmap Scan"
   */
  public String scanType;

  /**
   * DefectDojo ToolType Id
   * Used to differentiate different Types of tools from another
   *
   * Example
   */
  public TestType testType;

  @AllArgsConstructor
  public static enum TestType{
    API_TEST(1),
    STATIC_CHECK(2),
    PEN_TEST(3),
    WEB_APPLICATION_TEST(4),
    SECURITY_RESEARCH(5),
    THREAT_MODELLING(6),
    MANUAL_CODE_REVIEW(7);

    @JsonProperty
    public int id;
  }
}
