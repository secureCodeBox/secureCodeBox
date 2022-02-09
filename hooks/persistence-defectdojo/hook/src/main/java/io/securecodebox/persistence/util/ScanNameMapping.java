// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence.util;

import io.securecodebox.persistence.defectdojo.ScanType;
import lombok.NonNull;

public enum ScanNameMapping {
  NMAP("nmap", ScanType.NMAP_XML_SCAN),
  ZAP_BASELINE("zap-baseline-scan", ScanType.ZAP_SCAN),
  ZAP_API_SCAN("zap-api-scan", ScanType.ZAP_SCAN),
  ZAP_FULL_SCAN("zap-full-scan", ScanType.ZAP_SCAN),
  ZAP_ADVANCED_SCAN("zap-advanced-scan", ScanType.ZAP_SCAN),
  SSLYZE("sslyze", ScanType.SSLYZE_3_JSON_SCAN),
  TRIVY("trivy", ScanType.TRIVY_SCAN),
  GITLEAKS("gitleaks", ScanType.GITLEAKS_SCAN),
  NIKTO("nikto", ScanType.NIKTO_SCAN),
  NUCLEI("nuclei", ScanType.NUCLEI_SCAN),
  WPSCAN("wpscan", ScanType.WPSCAN),
  SEMGREP("semgrep", ScanType.SEMGREP_JSON_REPORT),
  GENERIC(null, ScanType.GENERIC_FINDINGS_IMPORT)
  ;

  /**
   * DefectDojo Scan Type
   * Example: "Nmap Scan"
   */
  public final ScanType scanType;

  /**
   * secureCodeBox ScanType
   * Examples: "nmap", "zap-api-scan", "zap-baseline-scan"
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
    return ScanNameMapping.GENERIC;
  }
}
