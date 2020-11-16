package io.securecodebox.persistence.util;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.NonNull;

@AllArgsConstructor
public enum ScanNameMapping {
  NMAP("Nmap Scan", TestType.WEB_APPLICATION_TEST, "nmap"),
  ZAP_BASELINE("ZAP Scan", TestType.WEB_APPLICATION_TEST, "zap-baseline"),
  ZAP_API_SCAN("ZAP Scan", TestType.API_TEST, "zap-api-scan"),
  ZAP_FULL_SCAN("ZAP Scan", TestType.WEB_APPLICATION_TEST, "zap-full-scan"),
  SSLYZE("SSLyze 3 Scan (JSON)", TestType.WEB_APPLICATION_TEST, "sslyze"),
  ;

  /**
   * DefectDojo Scan Type
   * Example: "Nmap Scan"
   */
  public final String scanType;
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
  protected final String scbScanType;

  public static ScanNameMapping bySecureCodeBoxScanType(@NonNull String scanType) {
    for (var mapping : ScanNameMapping.values()) {
      if (scanType.equals(mapping.scbScanType)) {
        return mapping;
      }
    }

    throw new IllegalArgumentException("No Mapping found for ScanType '" + scanType + "'");
  }

  @AllArgsConstructor
  public enum TestType {
    API_TEST(1),
    STATIC_CHECK(2),
    PEN_TEST(3),
    WEB_APPLICATION_TEST(4),
    SECURITY_RESEARCH(5),
    THREAT_MODELLING(6),
    MANUAL_CODE_REVIEW(7);

    @JsonProperty
    public final int id;
  }
}
