// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import uk.org.webcompere.systemstubs.environment.EnvironmentVariables;
import uk.org.webcompere.systemstubs.jupiter.SystemStub;
import uk.org.webcompere.systemstubs.jupiter.SystemStubsExtension;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;

@ExtendWith(SystemStubsExtension.class)
class EnvConfigTest {
  private final EnvConfig sut = new EnvConfig();
  @SystemStub
  private EnvironmentVariables environmentVariables;

  private void setEnvVar(EnvConfig.EnvVarNames name, String value) {
    environmentVariables.set(name.getLiteral(), value);
  }

  @Test
  void isDev_legacy_nullVarWillReturnFalse() {
    assertThat(sut.isDev(), is(false));
  }

  @Test
  void isDev_legacy_emptyVarWillReturnFalse() {
    setEnvVar(EnvConfig.EnvVarNames.IS_DEV_LEGACY, "");

    assertThat(sut.isDev(), is(false));
  }

  @Test
  void isDev_legacy_blankVarWillReturnFalse() {
    setEnvVar(EnvConfig.EnvVarNames.IS_DEV_LEGACY, "   ");

    assertThat(sut.isDev(), is(false));
  }

  @ParameterizedTest
  @ValueSource(strings = {"true", "True", "TRUE", "TrUe"})
  void isDev_legacy_trueVarWillReturnTrue(String var) {
    setEnvVar(EnvConfig.EnvVarNames.IS_DEV_LEGACY, var);

    assertThat(sut.isDev(), is(true));
  }

  @ParameterizedTest
  @ValueSource(strings = {"false", "False", "FALSE", "FaLsE"})
  void isDev_legacy_falseVarWillReturnFalse(String var) {
    setEnvVar(EnvConfig.EnvVarNames.IS_DEV_LEGACY, var);

    assertThat(sut.isDev(), is(false));
  }

  @Test
  void isDev_legacy_nonBooleanVarWillReturnFalse() {
    setEnvVar(EnvConfig.EnvVarNames.IS_DEV_LEGACY, "snafu");

    assertThat(sut.isDev(), is(false));
  }

  @Test
  void isDev_nullVarWillReturnFalse() {
    assertThat(sut.isDev(), is(false));
  }

  @Test
  void isDev_emptyVarWillReturnFalse() {
    setEnvVar(EnvConfig.EnvVarNames.IS_DEV, "");

    assertThat(sut.isDev(), is(false));
  }

  @Test
  void isDev_blankVarWillReturnFalse() {
    setEnvVar(EnvConfig.EnvVarNames.IS_DEV, "   ");

    assertThat(sut.isDev(), is(false));
  }

  @ParameterizedTest
  @ValueSource(strings = {"true", "True", "TRUE", "TrUe"})
  void isDev_trueVarWillReturnTrue(String var) {
    setEnvVar(EnvConfig.EnvVarNames.IS_DEV, var);

    assertThat(sut.isDev(), is(true));
  }

  @ParameterizedTest
  @ValueSource(strings = {"false", "False", "FALSE", "FaLsE"})
  void isDev_falseVarWillReturnFalse(String var) {
    setEnvVar(EnvConfig.EnvVarNames.IS_DEV, var);

    assertThat(sut.isDev(), is(false));
  }

  @Test
  void isDev_nonBooleanVarWillReturnFalse() {
    setEnvVar(EnvConfig.EnvVarNames.IS_DEV, "snafu");

    assertThat(sut.isDev(), is(false));
  }

  @Test
  void scanName_nullVarWillReturnEmptyString() {
    assertThat(sut.scanName(), is(""));
  }

  @Test
  void scanName_emptyVarWillReturnEmptyString() {
    setEnvVar(EnvConfig.EnvVarNames.SCAN_NAME, "");

    assertThat(sut.scanName(), is(""));
  }

  @Test
  void scanName_blankVarWillReturnEmptyString() {
    setEnvVar(EnvConfig.EnvVarNames.SCAN_NAME, "     ");

    assertThat(sut.scanName(), is(""));
  }

  @Test
  void scanName() {
    setEnvVar(EnvConfig.EnvVarNames.SCAN_NAME, "snafu");

    assertThat(sut.scanName(), is("snafu"));
  }

  @Test
  void namespace_nullVarWillReturnEmptyString() {
    assertThat(sut.namespace(), is(""));
  }

  @Test
  void namespace_emptyVarWillReturnEmptyString() {
    setEnvVar(EnvConfig.EnvVarNames.NAMESPACE, "");

    assertThat(sut.namespace(), is(""));
  }

  @Test
  void namespace_blankVarWillReturnEmptyString() {
    setEnvVar(EnvConfig.EnvVarNames.NAMESPACE, "    ");

    assertThat(sut.namespace(), is(""));
  }

  @Test
  void namespace() {
    setEnvVar(EnvConfig.EnvVarNames.NAMESPACE, "snafu");

    assertThat(sut.namespace(), is("snafu"));
  }

  @Test
  void lowPrivilegedMode_nullVarWillReturnFalse() {
    assertThat(sut.lowPrivilegedMode(), is(false));
  }

  @Test
  void lowPrivilegedMode_blankVarWillReturnFalse() {
    setEnvVar(EnvConfig.EnvVarNames.LOW_PRIVILEGED_MODE, "    ");

    assertThat(sut.lowPrivilegedMode(), is(false));
  }

  @Test
  void lowPrivilegedMode_emptyVarWillReturnFalse() {
    setEnvVar(EnvConfig.EnvVarNames.LOW_PRIVILEGED_MODE, "");

    assertThat(sut.lowPrivilegedMode(), is(false));
  }

  @ParameterizedTest
  @ValueSource(strings = {"true", "True", "TRUE", "TrUe"})
  void lowPrivilegedMode_trueVarWillReturnTrue(String var) {
    setEnvVar(EnvConfig.EnvVarNames.LOW_PRIVILEGED_MODE, var);

    assertThat(sut.lowPrivilegedMode(), is(true));
  }

  @ParameterizedTest
  @ValueSource(strings = {"false", "False", "FALSE", "FaLsE"})
  void lowPrivilegedMode_falseVarWillReturnFalse(String var) {
    setEnvVar(EnvConfig.EnvVarNames.LOW_PRIVILEGED_MODE, var);

    assertThat(sut.lowPrivilegedMode(), is(false));
  }

  @Test
  void lowPrivilegedMode_nonBooleanVarWillReturnFalse() {
    setEnvVar(EnvConfig.EnvVarNames.LOW_PRIVILEGED_MODE, "snafu");

    assertThat(sut.lowPrivilegedMode(), is(false));
  }

  @Test
  void refetchWaitSeconds_nullVarWillReturnZero() {
    assertThat(sut.refetchWaitSeconds(), is(0));
  }

  @Test
  void refetchWaitSeconds_blankVarWillReturnZero() {
    setEnvVar(EnvConfig.EnvVarNames.REFETCH_WAIT_SECONDS, "     ");

    assertThat(sut.refetchWaitSeconds(), is(0));
  }

  @Test
  void refetchWaitSeconds_emptyVarWillReturnZero() {
    setEnvVar(EnvConfig.EnvVarNames.REFETCH_WAIT_SECONDS, "");

    assertThat(sut.refetchWaitSeconds(), is(0));
  }

  @Test
  void refetchWaitSeconds_negativeVarWillReturnZero() {
    setEnvVar(EnvConfig.EnvVarNames.REFETCH_WAIT_SECONDS, "-23");

    assertThat(sut.refetchWaitSeconds(), is(0));
  }

  @Test
  void refetchWaitSeconds_nonParsableIntVarWillReturnZero() {
    setEnvVar(EnvConfig.EnvVarNames.REFETCH_WAIT_SECONDS, "snafu");

    assertThat(sut.refetchWaitSeconds(), is(0));
  }

  @Test
  void refetchWaitSeconds() {
    setEnvVar(EnvConfig.EnvVarNames.REFETCH_WAIT_SECONDS, "42");

    assertThat(sut.refetchWaitSeconds(), is(42));
  }
}
