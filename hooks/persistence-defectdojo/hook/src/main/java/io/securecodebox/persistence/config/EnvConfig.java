// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

/**
 * This class provides an API to access configuration values from environment variables
 */
@Slf4j
public final class EnvConfig {

  /**
   * Enables development mode
   * <p>
   * DO NOT SET {@code true} IN PRODUCTION!
   * </p>
   * <p>
   * This does special things for local development, such as
   * </p>
   * <ul>
   *   <li>Loading custom k8s config from {@literal ~/.kube/config}</li>
   * </ul>
   *
   * @return {@code false} is default
   * @see EnvVarNames#IS_DEV
   */
  public boolean isDev() {
    if (existsEnvVar(EnvVarNames.IS_DEV_LEGACY)) {
      log.warn("DEPRECATED usage of environment variable '{}'! Please use '{}' instead.",
        EnvVarNames.IS_DEV_LEGACY.getLiteral(), EnvVarNames.IS_DEV.getLiteral());
      return Boolean.parseBoolean(retrieveEnvVar(EnvVarNames.IS_DEV_LEGACY));
    }

    return Boolean.parseBoolean(retrieveEnvVar(EnvVarNames.IS_DEV));
  }

  public String scanName() {
    return retrieveEnvVar(EnvVarNames.SCAN_NAME);
  }

  public String namespace() {
    return retrieveEnvVar(EnvVarNames.NAMESPACE);
  }

  public boolean lowPrivilegedMode() {
    return Boolean.parseBoolean(retrieveEnvVar(EnvVarNames.LOW_PRIVILEGED_MODE));
  }

  /**
   * Returns the number of seconds to wait before re-fetching the issues from Defect Dojo
   * <p>
   * This configuration option is a workaround until DefectDojo provides an API which tells if the
   * processing – especially the deduplication – is done. Until this API is available we need to wait
   * sometime before we re-fetch issues from DefectDojo because the result will contain duplicates.
   * </p>
   *
   * @return not negative
   * @deprecated Will be removed without supplement, when DefectDojo API is available
   */
  @Deprecated
  public int refetchWaitSeconds() {
    final var raw = retrieveEnvVar(EnvVarNames.REFETCH_WAIT_SECONDS);

    try {
      return Math.max(0, Integer.parseInt(raw));
    } catch (NumberFormatException e) {
      log.warn("Could not convert the value '{}' from environment variable '{}' to an integer! Using 0 as fallback.", raw, EnvVarNames.REFETCH_WAIT_SECONDS.literal);
      return 0;
    }
  }

  private boolean existsEnvVar(EnvVarNames name) {
    return System.getenv(name.literal) != null;
  }


  private String retrieveEnvVar(EnvVarNames name) {
    if (existsEnvVar(name)) {
      return System.getenv(name.literal).trim();
    }

    return "";
  }

  /**
   * Enumerates all environment variable names used in this hook
   */
  @Getter
  enum EnvVarNames {
    /**
     * Enable development mode.
     *
     * @deprecated use {@link #IS_DEV} instead
     */
    @Deprecated
    IS_DEV_LEGACY("IS_DEV"),
    /**
     * Enable development mode.
     */
    IS_DEV("DEFECTDOJO_IS_DEV"),
    // TODO: Consider prefixing this name with DEFECTDOJO_.
    SCAN_NAME("SCAN_NAME"),
    // TODO: Consider prefixing this name with DEFECTDOJO_.
    NAMESPACE("NAMESPACE"),
    LOW_PRIVILEGED_MODE("DEFECTDOJO_LOW_PRIVILEGED_MODE"),
    REFETCH_WAIT_SECONDS("DEFECTDOJO_REFETCH_WAIT_SECONDS");

    private final String literal;

    EnvVarNames(String literal) {
      this.literal = literal;
    }
  }
}
