// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

export async function parse(fileContent) {
  return JSON.parse(fileContent) || [];
}
