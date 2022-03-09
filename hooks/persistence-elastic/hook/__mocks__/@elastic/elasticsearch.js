// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

class Client {
  constructor() {
    this.indices = {
      create: jest.fn(),
    };
    this.index = jest.fn();
    this.bulk = jest.fn(async () => {
      return {
        body: {
          errors: false,
        },
      };
    });
  }
}

module.exports.Client = Client;
