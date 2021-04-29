/*
 *  secureCodeBox (SCB)
 *  Copyright 2015-2021 iteratec GmbH
 *  https://www.iteratec.com
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  	http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package io.securecodebox.persistence.util;

import io.securecodebox.persistence.defectdojo.ScanType;
import lombok.NonNull;

public enum ScanNameMapping {
  NMAP("nmap", ScanType.NMAP_XML_SCAN),
  ZAP_BASELINE("zap-baseline", ScanType.ZAP_SCAN),
  ZAP_API_SCAN("zap-api-scan", ScanType.ZAP_SCAN),
  ZAP_FULL_SCAN("zap-full-scan", ScanType.ZAP_SCAN),
  SSLYZE("sslyze", ScanType.SSLYZE_3_JSON_SCAN),
  TRIVY("trivy", ScanType.TRIVY_SCAN),
  GITLEAKS("gitleaks", ScanType.GITLEAKS_SCAN),
  // nikto requires .json or .xml file extension
  // NIKTO("nikto", ScanType.NIKTO_SCAN), 
  GENERIC(null, ScanType.SECURECODEBOX_FINDINGS_IMPORT)
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
    return ScanNameMapping.GENERIC;
  }
}
