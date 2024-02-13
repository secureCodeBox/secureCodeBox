// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence.util;

import io.securecodebox.models.V1Scan;
import io.securecodebox.models.V1ScanSpec;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Tests for {@link DescriptionGenerator}
 */
class DescriptionGeneratorTest {

  private final DescriptionGenerator sut = new DescriptionGenerator();

  @Test
  @Disabled
  void generate() {
    final var scan = new V1Scan();
    assertThat(sut.generate(scan), is(""));
  }

  @Test
  void determineDefectDojoScanName() {
    final var spec = new V1ScanSpec();
    spec.setScanType(ScanNameMapping.NMAP.secureCodeBoxbScanType);
    final var scan = new V1Scan();
    scan.setSpec(spec);
    
    assertThat(sut.determineDefectDojoScanName(scan), is(ScanNameMapping.NMAP.defectDojoScanType.getTestType()));
  }

  @Test
  void determineDefectDojoScanName_givenScanMustNotBeNull() {
    final var e = assertThrows(NullPointerException.class, () -> sut.determineDefectDojoScanName(null));

    assertThat(e.getMessage(), is("Given parameter 'scan; must not be null!"));
  }

  @Test
  void determineDefectDojoScanName_scanSpecIsNullReturnsDefault() {
    final var scan = new V1Scan();

    assertAll(
      () -> assertThat(scan.getSpec(), is(nullValue())),
      () -> assertThat(sut.determineDefectDojoScanName(scan), is("Generic Findings Import"))
    );
  }

  @Test
  void determineDefectDojoScanName_scanSpecTypeIsNullReturnsDefault() {
    final var scan = new V1Scan();
    scan.setSpec(new V1ScanSpec());

    assertAll(
      () -> assertThat(scan.getSpec(), is(not(nullValue()))),
      () -> assertThat(sut.determineDefectDojoScanName(scan), is("Generic Findings Import"))
    );
  }
}
