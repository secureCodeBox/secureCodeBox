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

}
