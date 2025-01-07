// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;

class DefectDojoPersistenceProviderTest {

  private final DefectDojoPersistenceProvider sut = new DefectDojoPersistenceProvider();

  private static Stream<Arguments> provideWrongNumberOfArgumentsFixtures() {
    return Stream.of(
      Arguments.of(new String[0], false),
      Arguments.of(new String[1], false),
      Arguments.of(new String[2], true),
      Arguments.of(new String[3], false),
      Arguments.of(new String[4], true),
      Arguments.of(new String[5], false),
      Arguments.of(new String[6], false),
      Arguments.of(new String[7], false),
      Arguments.of(new String[8], false),
      Arguments.of(new String[9], false),
      Arguments.of(new String[10], false)
    );
  }

  @ParameterizedTest
  @MethodSource("provideWrongNumberOfArgumentsFixtures")
  void wrongNumberOfArguments(final String[] args, final boolean numberOfArgsCorrect) {
    assertThat(sut.wrongNumberOfArguments(args), is(numberOfArgsCorrect));
  }

  private static Stream<Arguments> provideShouldShowHelpFixtures() {
    return Stream.of(
      Arguments.of(new String[]{}, false),
      Arguments.of(new String[]{"foo"}, false),
      Arguments.of(new String[]{"foo", "bar"}, false),
      Arguments.of(new String[]{"foo", "bar", "baz"}, false),
      Arguments.of(new String[]{"-h"}, true),
      Arguments.of(new String[]{"--help"}, true),
      Arguments.of(new String[]{"foo", "-h", "baz"}, true),
      Arguments.of(new String[]{"foo", "bar", "--help"}, true)
    );
  }

  @ParameterizedTest
  @MethodSource("provideShouldShowHelpFixtures")
  void shouldShowHelp(final String[] args, final boolean showHelp) {
    assertThat(sut.shouldShowHelp(args), is(showHelp));
  }

}
