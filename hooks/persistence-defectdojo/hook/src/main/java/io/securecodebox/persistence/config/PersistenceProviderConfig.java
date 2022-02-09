// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.config;

import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.ZoneId;
import java.util.List;

/**
 * Reads the configured Up / Download Urls for RawResults and Findings from the command line args and determines if
 * the Hook is run in ReadOnly or ReadAndWrite mode based on the number of args.
 */
public class PersistenceProviderConfig {
  private static final Logger LOG = LoggerFactory.getLogger(PersistenceProviderConfig.class);

  final int RAW_RESULT_DOWNLOAD_ARG_POSITION = 0;
  final int FINDING_DOWNLOAD_ARG_POSITION = 1;

  final int RAW_RESULT_UPLOAD_ARG_POSITION = 2;
  final int FINDING_UPLOAD_ARG_POSITION = 3;

  // DefectDojo does in contrast to secureCodeBox not pay attention to time zones
  // to guarantee consistent results when converting back and forth  a time zone
  // has to be assumed for DefectDojo. It defaults to the Time Zone of the system clock
  @Getter
  ZoneId defectDojoTimezoneId = ZoneId.systemDefault();

  // Download Urls
  @Getter
  final String rawResultDownloadUrl;
  @Getter
  final String findingDownloadUrl;

  // Upload Urls
  final String rawResultUploadUrl;
  final String findingUploadUrl;

  public String getRawResultUploadUrl(){
    if(isReadOnly()) {
      throw new RuntimeException("Cannot Access RawResult Upload URL as the hook is run is ReadOnly mode.");
    }
    return rawResultUploadUrl;
  }
  public String getFindingUploadUrl(){
    if(isReadOnly()) {
      throw new RuntimeException("Cannot Access Finding Upload URL as the hook is run is ReadOnly mode.");
    }
    return findingUploadUrl;
  }

  final boolean readOnly;

  public boolean isReadOnly() {
    return readOnly;
  }

  public boolean isReadAndWrite() {
    return !readOnly;
  }

  public boolean isInLowPrivilegedMode() {
    String LOW_PRIVILEGED_MODE = "DEFECTDOJO_LOW_PRIVILEGED_MODE";
    if (System.getenv(LOW_PRIVILEGED_MODE) != null) {
      return "true".equals(System.getenv(LOW_PRIVILEGED_MODE));
    }
    return false;
  }

  public PersistenceProviderConfig(String[] args) {
    // Parse Hook Args passed via command line flags
    if (args == null) {
      throw new RuntimeException("Received `null` as command line flags. Expected exactly four (RawResult & Finding Up/Download Urls)");
    } else if (args.length == 2) {
      this.readOnly = true;

      this.rawResultDownloadUrl = args[RAW_RESULT_DOWNLOAD_ARG_POSITION];
      this.findingDownloadUrl = args[FINDING_DOWNLOAD_ARG_POSITION];
      // Not set for ReadOnly hooks
      this.rawResultUploadUrl = null;
      this.findingUploadUrl = null;
    } else if (args.length == 4) {
      this.readOnly = false;

      this.rawResultDownloadUrl = args[RAW_RESULT_DOWNLOAD_ARG_POSITION];
      this.findingDownloadUrl = args[FINDING_DOWNLOAD_ARG_POSITION];
      this.rawResultUploadUrl = args[RAW_RESULT_UPLOAD_ARG_POSITION];
      this.findingUploadUrl = args[FINDING_UPLOAD_ARG_POSITION];
    } else {
      LOG.error("Received unexpected command line arguments: {}", List.of(args));
      throw new RuntimeException("DefectDojo Hook received a unexpected number of command line flags. Expected exactly two (for ReadOnly Mode) or four (for ReadAndWrite mode)");
    }
  }
}
