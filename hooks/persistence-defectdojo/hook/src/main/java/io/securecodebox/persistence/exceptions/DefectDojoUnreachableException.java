// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
package io.securecodebox.persistence.exceptions;

public class DefectDojoUnreachableException extends RuntimeException {
  public DefectDojoUnreachableException(String message) {
    super(message);
  }

  public DefectDojoUnreachableException(String message, Throwable cause) {
    super(message, cause);
  }
}
