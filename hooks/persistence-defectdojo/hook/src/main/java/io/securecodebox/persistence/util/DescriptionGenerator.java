// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence.util;

import io.securecodebox.models.V1Scan;

import java.text.MessageFormat;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;

public class DescriptionGenerator {

  protected static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss");
  private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
  Clock clock = Clock.systemDefaultZone();

  public String generate(V1Scan scan) {
    var spec = Objects.requireNonNull(scan.getSpec());

    return String.join(
      System.getProperty("line.separator"),
      MessageFormat.format("# {0}", getDefectDojoScanName(scan)),
      MessageFormat.format("Started: {0}", getStartTime(scan)),
      MessageFormat.format("Ended: {0}", currentTime()),
      MessageFormat.format("ScanType: {0}", spec.getScanType()),
      MessageFormat.format("Parameters: [{0}]", String.join(",", Objects.requireNonNull(spec.getParameters())))
    );
  }

  private String getStartTime(V1Scan scan) {
    if (scan.getMetadata() == null || scan.getMetadata().getCreationTimestamp() == null) {
      return null;
    }
    return scan.getMetadata().getCreationTimestamp().format(TIME_FORMAT);
  }

  /**
   * Returns the current date as string based on the DATE_FORMAT.
   *
   * @return the current date as string based on the DATE_FORMAT.
   */
  public String currentDate() {
    return LocalDate.now(clock).format(DATE_FORMAT);
  }

  public String currentTime() {
    return LocalDateTime.now(clock).format(TIME_FORMAT);
  }

  public void setClock(Clock clock) {
    this.clock = clock;
  }

  public String getDefectDojoScanName(V1Scan scan) {
    return ScanNameMapping.bySecureCodeBoxScanType(scan.getSpec().getScanType()).scanType.getTestType();
  }
}
