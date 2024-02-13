// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence.util;

import io.kubernetes.client.openapi.models.V1ObjectMeta;
import io.securecodebox.models.V1Scan;
import io.securecodebox.models.V1ScanSpec;
import io.securecodebox.models.V1ScanStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for {@link DescriptionGenerator}
 */
class DescriptionGeneratorTest {

  @BeforeEach
  public void setUp() {
    final var fixedClock = Clock.fixed(
      Instant.ofEpochSecond(1546876203),
      ZoneId.of("Europe/Berlin"));
    sut.setClock(fixedClock);
  }

  private final DescriptionGenerator sut = new DescriptionGenerator();

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

  @Test
  void determineStartTime() {
    final var metadata = new V1ObjectMeta();
    metadata.setCreationTimestamp(OffsetDateTime.MAX);
    final var scan = new V1Scan();
    scan.setMetadata(metadata);

    assertThat(sut.determineStartTime(scan), is("31.12.+999999999 23:59:59"));
  }

  @Test
  void determineStartTime_givenScanMustNotBeNull() {
    final var e = assertThrows(NullPointerException.class, () -> sut.determineStartTime(null));

    assertThat(e.getMessage(), is("Given parameter 'scan; must not be null!"));
  }

  @Test
  void determineStartTime_metaDataIsNullReturnsDefaultString() {
    final var scan = new V1Scan();

    assertThat(sut.determineStartTime(scan), is("n/a"));
  }

  @Test
  void determineStartTime_metaDatasCreationTimestampIsNullReturnsDefaultString() {
    final var scan = new V1Scan();
    scan.setMetadata(new V1ObjectMeta());

    assertThat(sut.determineStartTime(scan), is("n/a"));
  }
  //////////////////////////////////////
  //////////////////////////////////////

  @Test
  void generate() {
    final var scan = new V1Scan();
    scan.setMetadata(new V1ObjectMeta());
    scan.setSpec(new V1ScanSpec());
    scan.setStatus(new V1ScanStatus());
    scan.getSpec().setScanType("nmap");
    scan.getMetadata().setName("test-scan");
    scan.getMetadata().setCreationTimestamp(OffsetDateTime.parse("2010-06-30T01:20+02:00"));
    scan.getSpec().setParameters(List.of());

    assert scan.getMetadata() != null;

    scan.getMetadata().setName("nmap");
    scan.getSpec().setScanType("nmap");
    scan.getSpec().setParameters(List.of("http://example.target"));

    assertEquals(
      String.join(
        "\n",
        "# Nmap Scan",
        "Started: 30.06.2010 01:20:00",
        "Ended: 07.01.2019 16:50:03",
        "ScanType: nmap",
        "Parameters: [http://example.target]"
      ),
      sut.generate(scan)
    );
  }

  @Test
  void nullGenerate() {
    final var scan = new V1Scan();
    scan.setMetadata(new V1ObjectMeta());
    scan.setSpec(new V1ScanSpec());
    scan.setStatus(new V1ScanStatus());
    scan.getSpec().setScanType("nmap");
    scan.getMetadata().setName("test-scan");
    scan.getMetadata().setCreationTimestamp(OffsetDateTime.parse("2010-06-30T01:20+02:00"));
    scan.getSpec().setParameters(List.of());

    assertEquals(String.join(
      "\n",
      "# Nmap Scan",
      "Started: 30.06.2010 01:20:00",
      "Ended: 07.01.2019 16:50:03",
      "ScanType: nmap",
      "Parameters: []"
    ), sut.generate(scan));
  }

  @Test
  void shouldUseCurrentTimeIfEndedAtIsntSet() {
    final var scan = new V1Scan();
    scan.setMetadata(new V1ObjectMeta());
    scan.setSpec(new V1ScanSpec());
    scan.setStatus(new V1ScanStatus());
    scan.getSpec().setScanType("nmap");
    scan.getMetadata().setName("test-scan");
    scan.getMetadata().setCreationTimestamp(OffsetDateTime.parse("2010-06-30T01:20+02:00"));
    scan.getSpec().setParameters(List.of());

    scan.getStatus().setFinishedAt(null);

    assertEquals(String.join(
      "\n",
      "# Nmap Scan",
      "Started: 30.06.2010 01:20:00",
      "Ended: 07.01.2019 16:50:03",
      "ScanType: nmap",
      "Parameters: []"
    ), sut.generate(scan));
  }
}
