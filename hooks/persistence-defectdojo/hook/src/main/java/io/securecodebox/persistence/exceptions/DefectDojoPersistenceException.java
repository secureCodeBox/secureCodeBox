// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence.exceptions;

/**
 * The base error type of this hook
 */
public class DefectDojoPersistenceException extends RuntimeException {
  /**
   * Creates an exception with a message
   *
   * @param message must not be {@code null} ar empty. Should be formatted to be directly printed to STDERR.
   */
  public DefectDojoPersistenceException(String message) {
    this(message, null);
  }

  /**
   * Dedicated constructor
   *
   * @param message see {@link #DefectDojoPersistenceException(String}
   * @param cause   may be {@code null} if context where the exception occurred is unnecessary.
   */
  public DefectDojoPersistenceException(String message, Throwable cause) {
    super(message, cause);
  }
}
