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
