// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence.exceptions;

public class DefectDojoLoopException extends DefectDojoPersistenceException {
  public DefectDojoLoopException(String message) {
    super(message);
  }

  public DefectDojoLoopException(String message, Throwable cause) {
    super(message, cause);
  }
}
