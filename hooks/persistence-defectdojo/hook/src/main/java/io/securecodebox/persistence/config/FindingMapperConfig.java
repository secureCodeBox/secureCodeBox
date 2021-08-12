package io.securecodebox.persistence.config;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.ZoneId;
import java.util.TimeZone;

/**
 * Stores the config for parsing
 */
@NoArgsConstructor
@AllArgsConstructor
public class FindingMapperConfig {
  // In contrast to the secureCodeBox, DefectDojo Dates have no TimeZone Information
  // Therefore to consistently convert the Findings in both directions a TimeZone has to be assumed or specified
  @Getter
  private TimeZone defectDojoTimezone = TimeZone.getTimeZone(ZoneId.systemDefault());
}
