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
  ZAP_AUTOMATION_SCAN("zap-automation-scan", ScanType.ZAP_SCAN),
  SSLYZE("sslyze", ScanType.SSLYZE_SCAN),
  TRIVY("trivy", ScanType.TRIVY_SCAN),
  GITLEAKS("gitleaks", ScanType.GITLEAKS_SCAN),
  NIKTO("nikto", ScanType.NIKTO_SCAN),
  NUCLEI("nuclei", ScanType.NUCLEI_SCAN),
  WPSCAN("wpscan", ScanType.WPSCAN),
  SEMGREP("semgrep", ScanType.SEMGREP_JSON_REPORT),
  GENERIC(null, ScanType.GENERIC_FINDINGS_IMPORT);

  /**
   * DefectDojo Scan Type
   *
   * @see ScanType
   */
  public final ScanType defectDojoScanType;

  /**
   * secureCodeBox ScanType
   * <p>
   * Examples: {@literal "nmap"}, {@literal }"zap-api-scan"}, {@literal "zap-baseline-scan"}
   * </p>
   */
  public final String secureCodeBoxbScanType;

  ScanNameMapping(String secureCodeBoxbScanType, ScanType defectDojoScanType) {
    this.secureCodeBoxbScanType = secureCodeBoxbScanType;
    this.defectDojoScanType = defectDojoScanType;
  }

  public static ScanNameMapping bySecureCodeBoxScanType(@NonNull String scanType) {
    for (var mapping : ScanNameMapping.values()) {
      if (scanType.equals(mapping.secureCodeBoxbScanType)) {
        return mapping;
      }
    }
    return ScanNameMapping.GENERIC;
  }
}
