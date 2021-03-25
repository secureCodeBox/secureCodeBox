package io.securecodebox.persistence.service;

import io.securecodebox.persistence.models.Finding;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

class KubernetesServiceTest {

  @Test
  public void calculatesFindingStatsCorrectly() throws Exception{
    var findings = List.of(
      Finding.builder().category("Open Port").severity(Finding.Severities.Informational).build(),
      Finding.builder().category("Open Port").severity(Finding.Severities.Informational).build(),
      Finding.builder().category("Open Port").severity(Finding.Severities.Informational).build(),
      Finding.builder().category("Host").severity(Finding.Severities.Informational).build()
    );

    var actualStats = KubernetesService.recalculateFindingStats(findings);

    assertEquals(4L, actualStats.getCount());

    assertNotNull(actualStats.getCategories());
    assertEquals(
      3L,
      actualStats.getCategories().computeIfAbsent("Open Port", key -> { throw new NoSuchElementException("Map didn't contain expected key"); } )
    );
    assertEquals(
      1L,
      actualStats.getCategories().computeIfAbsent("Host", key -> { throw new NoSuchElementException("Map didn't contain expected key"); } )
    );

    assertNotNull(actualStats.getSeverities());
    assertEquals(4L, actualStats.getSeverities().getInformational());
    assertEquals(0L, actualStats.getSeverities().getLow());
    assertEquals(0L, actualStats.getSeverities().getMedium());
    assertEquals(0L, actualStats.getSeverities().getHigh());
  }

  @Test
  public void calculatesFindingStatsForEmptyFindingsCorrectly() throws Exception{
    List<Finding> findings = List.of();

    var actualStats = KubernetesService.recalculateFindingStats(findings);

    assertEquals(0L, actualStats.getCount());

    assertNotNull(actualStats.getCategories());
    assertEquals(actualStats.getCategories().size(), 0);

    assertNotNull(actualStats.getSeverities());
    assertEquals(0L, actualStats.getSeverities().getInformational());
    assertEquals(0L, actualStats.getSeverities().getLow());
    assertEquals(0L, actualStats.getSeverities().getMedium());
    assertEquals(0L, actualStats.getSeverities().getHigh());
  }
}
