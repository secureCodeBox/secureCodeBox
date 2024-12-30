// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.config;

import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import lombok.Getter;
import lombok.NonNull;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;

import java.time.ZoneId;
import java.util.List;

/**
 * Reads the configured Up / Download Urls for RawResults and Findings from the command line args and determines if
 * the Hook is run in ReadOnly or ReadAndWrite mode based on the number of args.
 */
@Slf4j
@ToString
public final class PersistenceProviderConfig {
  private static final int RAW_RESULT_DOWNLOAD_ARG_POSITION = 0;
  private static final int FINDING_DOWNLOAD_ARG_POSITION = 1;
  private static final int RAW_RESULT_UPLOAD_ARG_POSITION = 2;
  private static final int FINDING_UPLOAD_ARG_POSITION = 3;
  public static final int NUMBER_OF_ARGS_READONLY = 2;
  public static final int NUMBER_OF_ARGS_READWRITE = 4;

  private final EnvConfig env = new EnvConfig();
  /**
   * Assumed time zone of DefectDojo
   * <p>
   * DefectDojo does in contrast to secureCodeBox not pay attention to time zones
   * to guarantee consistent results when converting back and forth  a time zone
   * has to be assumed for DefectDojo. It defaults to the Time Zone of the system clock.
   * </p>
   */
  @Getter
  final ZoneId defectDojoTimezoneId = ZoneId.systemDefault();
  @Getter
  final boolean readOnly;

  /**
   * URL where to download the raw result file
   */
  @Getter
  final String rawResultDownloadUrl;
  /**
   * URL where to download the parsed finding file
   */
  @Getter
  final String findingDownloadUrl;
  /**
   * URL where to upload the raw result file, maybe {@code null}
   */
  final String rawResultUploadUrl;
  /**
   * URL where to upload the parsed finding file, maybe {@code null}
   */
  final String findingUploadUrl;

  /**
   * Provider configuration
   *
   * @param args not {@code null}, hook args passed via command line flags
   */
  public PersistenceProviderConfig(@NonNull final String[] args) {
    if (args.length == NUMBER_OF_ARGS_READONLY) {
      this.readOnly = true;
      this.rawResultDownloadUrl = args[RAW_RESULT_DOWNLOAD_ARG_POSITION];
      this.findingDownloadUrl = args[FINDING_DOWNLOAD_ARG_POSITION];
      // Not set for ReadOnly hooks
      this.rawResultUploadUrl = null;
      this.findingUploadUrl = null;
    } else if (args.length == NUMBER_OF_ARGS_READWRITE) {
      this.readOnly = false;
      this.rawResultDownloadUrl = args[RAW_RESULT_DOWNLOAD_ARG_POSITION];
      this.findingDownloadUrl = args[FINDING_DOWNLOAD_ARG_POSITION];
      this.rawResultUploadUrl = args[RAW_RESULT_UPLOAD_ARG_POSITION];
      this.findingUploadUrl = args[FINDING_UPLOAD_ARG_POSITION];
    } else {
      final var msg = "Unexpected number of arguments given %d! Expected are either %d or %d arguments in array!";
      throw new DefectDojoPersistenceException(
        String.format(msg, args.length, NUMBER_OF_ARGS_READONLY, NUMBER_OF_ARGS_READWRITE));
    }
  }

  /**
   * Throws {@link DefectDojoPersistenceException} if {@link #isReadOnly()} is {@code true}
   */
  public String getRawResultUploadUrl() {
    if (isReadOnly()) {
      throw new DefectDojoPersistenceException("Cannot access the RawResult Upload URL because the hook is executed in ReadOnly mode!");
    }
    return rawResultUploadUrl;
  }

  /**
   * Throws {@link DefectDojoPersistenceException} if {@link #isReadOnly()} is {@code true}
   */
  public String getFindingUploadUrl() {
    if (isReadOnly()) {
      throw new DefectDojoPersistenceException("Cannot access the Finding Upload URL because the hook is executed in ReadOnly mode!");
    }
    return findingUploadUrl;
  }

  public boolean isReadAndWrite() {
    return !readOnly;
  }

  public boolean isInLowPrivilegedMode() {
    return env.lowPrivilegedMode();
  }

}
