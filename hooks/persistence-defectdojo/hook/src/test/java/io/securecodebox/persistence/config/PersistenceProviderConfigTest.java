// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence.config;

import io.securecodebox.persistence.exceptions.DefectDojoPersistenceException;
import org.junit.jupiter.api.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.*;

class PersistenceProviderConfigTest {
  @Test
  void constructorRequiresNonNullArgument() {
    assertThrows(NullPointerException.class, () -> new PersistenceProviderConfig(null));
  }

  @Test
  void constructorWithTwoArgsCreatesReadOnlyConfig() {
    final var sut = new PersistenceProviderConfig(new String[]{"foo", "bar"});

    assertAll(
      () -> assertThat(sut.isReadOnly(), is(true)),
      () -> assertThat(sut.isReadAndWrite(), is(false)),
      () -> assertThat(sut.getRawResultDownloadUrl(), is("foo")),
      () -> assertThat(sut.getFindingDownloadUrl(), is("bar")),
      () -> assertThrows(DefectDojoPersistenceException.class, sut::getRawResultUploadUrl),
      () -> assertThrows(DefectDojoPersistenceException.class, sut::getFindingUploadUrl)
    );
  }

  @Test
  void constructorWithFourArgsCreatesReadWriteConfig() {
    final var sut = new PersistenceProviderConfig(new String[]{"foo", "bar", "baz", "snafu"});

    assertAll(
      () -> assertThat(sut.isReadOnly(), is(false)),
      () -> assertThat(sut.isReadAndWrite(), is(true)),
      () -> assertThat(sut.getRawResultDownloadUrl(), is("foo")),
      () -> assertThat(sut.getFindingDownloadUrl(), is("bar")),
      () -> assertThat(sut.getRawResultUploadUrl(), is("baz")),
      () -> assertThat(sut.getFindingUploadUrl(), is("snafu"))
    );
  }

  @Test
  void constructorThrowsExceptionForWrongArgumentLength() {
    assertAll(
      () -> assertThrows(DefectDojoPersistenceException.class, () -> new PersistenceProviderConfig(new String[0])),
      () -> assertThrows(DefectDojoPersistenceException.class, () -> new PersistenceProviderConfig(new String[]{"foo"})),
      () -> assertThrows(DefectDojoPersistenceException.class, () -> new PersistenceProviderConfig(new String[]{"foo", "bar", "baz"})),
      () -> assertThrows(DefectDojoPersistenceException.class, () -> new PersistenceProviderConfig(new String[]{"foo", "bar", "baz", "snafu", "shtf"}))
    );
  }
}
