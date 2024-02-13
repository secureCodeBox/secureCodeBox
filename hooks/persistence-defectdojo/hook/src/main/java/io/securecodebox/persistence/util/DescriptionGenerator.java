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
import java.util.List;
import java.util.Objects;

/**
 * Helper to format a descriptive text for scans
 */
public final class DescriptionGenerator {

  private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss");
  private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
  private static final String DEFAULT_DEFECTDOJO_SCAN_NAME = ScanNameMapping.GENERIC.defectDojoScanType.getTestType();
  private static final String LINE_BREAK = "\n";
  private Clock clock = Clock.systemDefaultZone();

  public String generate(V1Scan scan) {
    final var spec = Objects.requireNonNull(scan.getSpec());
    final var buffer = new StringBuilder()
      .append(MessageFormat.format("# {0}", determineDefectDojoScanName(scan))).append(LINE_BREAK)
      .append(MessageFormat.format("Started: {0}", determineStartTime(scan))).append(LINE_BREAK)
      .append(MessageFormat.format("Ended: {0}", currentTime())).append(LINE_BREAK)
      .append(MessageFormat.format("ScanType: {0}", spec.getScanType())).append(LINE_BREAK);

    var parameters = spec.getParameters();

    if (parameters == null) {
      // Since this value may be null, we default to empty list to prevent NPE on fromatting it.
      parameters = List.of();
    }

    buffer.append(MessageFormat.format("Parameters: [{0}]", String.join(",", parameters)));
    return buffer.toString();
  }


  /**
   * Returns the current date as string based on the DATE_FORMAT
   *
   * @return never {@code null}
   */
  public String currentDate() {
    return LocalDate.now(clock).format(DATE_FORMAT);
  }

  private String currentTime() {
    return LocalDateTime.now(clock).format(TIME_FORMAT);
  }

  /**
   * Injection point for side effects
   * <p>
   * This is merely for testing purposes.
   * </p>
   *
   * @param clock not {@code null}
   */
  void setClock(Clock clock) {
    this.clock = clock;
  }

  /**
   * Determines the DefectDojo scan name from given scan
   *
   * <p>If no particular type can't be determined (due to null value or unmapped types)
   * {@link ScanNameMapping#GENERIC} will be returned as default</p>
   *
   * @param scan Must not be {@code null}
   * @return never {@code null} nor empty
   */
  String determineDefectDojoScanName(V1Scan scan) {
    final var spec = Objects.requireNonNull(scan, "Given parameter 'scan; must not be null!")
      .getSpec();

    if (spec == null) {
      return DEFAULT_DEFECTDOJO_SCAN_NAME;
    }

    if (spec.getScanType() == null) {
      return DEFAULT_DEFECTDOJO_SCAN_NAME;
    }

    return ScanNameMapping.bySecureCodeBoxScanType(spec.getScanType())
      .defectDojoScanType
      .getTestType();
  }

  String determineStartTime(V1Scan scan) {
    Objects.requireNonNull(scan, "Given parameter 'scan; must not be null!");

    if (scan.getMetadata() == null || scan.getMetadata().getCreationTimestamp() == null) {
      return "n/a";
    }

    return scan.getMetadata().getCreationTimestamp().format(TIME_FORMAT);
  }
}
