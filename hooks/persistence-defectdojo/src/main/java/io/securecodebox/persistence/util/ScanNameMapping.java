package io.securecodebox.persistence.util;

import io.securecodebox.persistence.defectdojo.ScanType;
import lombok.NonNull;

public enum ScanNameMapping {
  NMAP("nmap", ScanType.NMAP_SCAN),
  ZAP_BASELINE("zap-baseline", ScanType.ZAP_SCAN),
  ZAP_API_SCAN("zap-api-scan", ScanType.ZAP_SCAN),
  ZAP_FULL_SCAN("zap-full-scan", ScanType.ZAP_SCAN),
  SSLYZE("sslyze", ScanType.SS_LYZE_3_SCAN_JSON),
  TRIVY("trivy", ScanType.TRIVY_SCAN),
  GITLEAKS("gitleaks", ScanType.GITLEAKS_SCAN),
  ;

  /**
   * DefectDojo Scan Type
   * Example: "Nmap Scan"
   */
  public final ScanType scanType;

  /**
   * secureCodeBox ScanType
   * Examples: "nmap", "zap-api-scan", "zap-baseline"
   */
  public final String scbScanType;

  ScanNameMapping(String scbScanType, ScanType scanType) {
    this.scbScanType = scbScanType;
    this.scanType = scanType;
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
