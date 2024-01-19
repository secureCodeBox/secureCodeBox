// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence.strategies;

import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.TimeUnit;

/**
 * Used to wait certain amount of seconds
 * <p>
 * Basically this is an abstraction for {@link Thread#sleep(long, int)}.
 * </p>
 * <p>
 * This class is immutable and therefore thread safe.
 * </p>
 */
@Slf4j
final class Awaiter {
  private final int secondsToWait;

  /**
   * Dedicated constructor
   *
   * @param secondsToWait amount of seconds to wait
   */
  Awaiter(int secondsToWait) {
    super();
    this.secondsToWait = secondsToWait;
  }

  /**
   * Blocks for given amount of seconds
   * <p>
   * This method blocks the execution of current thread for the amont of seconds given to the
   * {@link Awaiter#Awaiter(int) constructor}. If a value of zero or les is given the method does nothing.
   * </p>
   * <p>
   * Any {@link InterruptedException} caught and logged to the logging facade.
   * </p>
   */
  void await() {
    if (secondsToWait > 0) {
      try {
        TimeUnit.SECONDS.sleep(secondsToWait);
      } catch (InterruptedException e) {
        log.warn("Waiting failed!", e);
      }
    }
  }
}
