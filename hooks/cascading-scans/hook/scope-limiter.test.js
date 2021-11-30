// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const { isInScope: isInScopeInternal }  = require("./scope-limiter");

let scopeLimiter = undefined
let annotations = undefined
let finding = undefined
let scopeLimiterAliases = undefined

const isInScope = () => isInScopeInternal(
  scopeLimiter,
  annotations,
  finding,
  scopeLimiterAliases
)

beforeEach(function () {
  scopeLimiter = {
    validOnMissingRender: false,
    allOf: [],
    anyOf: [],
    noneOf: [],
  }

  annotations = {}

  finding = {
    attributes: {
      hostname: "example.com",
    }
  }

  scopeLimiterAliases = {}
})

it("Requirement key must start with 'scope.cascading.securecodebox.io/'", () => {
  scopeLimiter.allOf = [
    {
      key: "engagement.scope/domains",
      operator: "Contains",
      values: ["{{attributes.hostname}}"],
    }
  ]
  expect(isInScope).toThrowError("key 'engagement.scope/domains' is invalid: key does not start with 'scope.cascading.securecodebox.io/'");
});

it("Requirement key must map to an annotation", () => {
  scopeLimiter.allOf = [
    {
      key: "scope.cascading.securecodebox.io/domain",
      operator: "In",
      values: ["{{attributes.hostname}}"],
    }
  ]

  finding = {
    attributes: {
      hostname: "notexample.com",
    }
  };

  expect(isInScope).toThrowError("using operator 'In': the referenced annotation may not be undefined");
});

describe("Templating", function () {
  it("does not support requirement key", () => {
    annotations = {
      "scope.cascading.securecodebox.io/example.com": "example.com"
    }
    scopeLimiter.allOf = [
      {
        key: "scope.cascading.securecodebox.io/{{attributes.hostname}}",
        operator: "Contains",
        values: ["{{attributes.hostname}}"],
      }
    ]
    expect(isInScope).toThrowError("using operator 'Contains': the referenced annotation may not be undefined");
  });

  it("supports requirement value", () => {
    annotations = {
      "scope.cascading.securecodebox.io/domains": "example.com,subdomain.example.com",
    }
    scopeLimiter.allOf = [
      {
        key: "scope.cascading.securecodebox.io/domains",
        operator: "Contains",
        values: ["{{attributes.hostname}}"],
      }
    ]
    expect(isInScope()).toBe(true);
  });

  describe("validOnMissingRender", function () {
    it("does not match if mapping is not available: validOnMissingRender false", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domains": "example.com,subdomain.example.com",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/domains",
          operator: "Contains",
          values: ["{{$.hostname}}"],
        }
      ]

      finding = {}

      expect(isInScope()).toBe(false);
    });
  })

  describe("aliases", function () {
    it("matches using templates populated with finding and a mapped selector", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domains": "example.com,subdomain.example.com",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/domains",
          operator: "Contains",
          values: ["{{$.hostname}}"],
        }
      ]
      scopeLimiterAliases = {
        "hostname": "{{attributes.hostname}}",
      }
      expect(isInScope()).toBe(true);
    });

    it("Matches if mapping is not available: validOnMissingRender true", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domains": "example.com,subdomain.example.com",
      }

      scopeLimiter.validOnMissingRender = true
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/domains",
          operator: "Contains",
          values: ["{{$.hostname}}"],
        }
      ]
      finding = {}

      expect(isInScope()).toBe(true);
    });

  })

  describe("lists", function () {
    describe("list", function () {
      it("matches with list of strings", () => {
        annotations = {
          "scope.cascading.securecodebox.io/domain": "example.com",
        }
        scopeLimiter.allOf = [
          {
            key: "scope.cascading.securecodebox.io/domain",
            operator: "SubdomainOf",
            values: ["{{#asList}}attributes.domains{{/asList}}"],
          }
        ]

        finding = {
          attributes: {
            domains: ["example.com", "subdomain.example.com"],
          }
        };

        expect(isInScope()).toBe(true);
      });

      it("fails with too short key", () => {
        annotations = {
          "scope.cascading.securecodebox.io/CIDR": "127.0.0.0/8",
        }
        scopeLimiter.allOf = [
          {
            key: "scope.cascading.securecodebox.io/CIDR",
            operator: "InCIDR",
            values: ["{{#asList}}attributes{{/asList}}"],
          }
        ]

        finding = {}

        expect(isInScope).toThrowError("Invalid list key 'attributes'. List key must be at least 2 levels deep. E.g. 'attributes.addresses'");
      });
    })

    describe("split", function () {
      it("matches on simple string", () => {
        annotations = {
          "scope.cascading.securecodebox.io/domains": "example.com",
        }
        scopeLimiter.allOf = [
          {
            key: "scope.cascading.securecodebox.io/domains",
            operator: "SubdomainOf",
            values: ["{{#split}}subdomain.example.com,www.example.com{{/split}}"],
          }
        ]
        expect(isInScope()).toBe(true);
      });

      it("matches on template", () => {
        annotations = {
          "scope.cascading.securecodebox.io/domains": "example.com",
        }
        scopeLimiter.allOf = [
          {
            key: "scope.cascading.securecodebox.io/domains",
            operator: "SubdomainOf",
            values: ["{{#split}}{{attributes.hostnames}}{{/split}}"],
          }
        ]

        finding = {
          attributes: {
            hostnames: ["subdomain.example.com", "www.example.com"],
          }
        }

        expect(isInScope()).toBe(true)
      });

      it("does not ignore the last entry in the split list", () => {
        annotations = {
          "scope.cascading.securecodebox.io/domains": "example.com",
        }
        scopeLimiter.allOf = [
          {
            key: "scope.cascading.securecodebox.io/domains",
            operator: "SubdomainOf",
            values: ["{{#split}}example.com,some.otherdomain.com{{/split}}"],
          }
        ]

        expect(isInScope()).toBe(false)
      });

      it("does not create extra empty entry for trailing comma", () => {
        annotations = {
          "scope.cascading.securecodebox.io/domains": "example.com",
        }
        scopeLimiter.allOf = [
          {
            key: "scope.cascading.securecodebox.io/domains",
            operator: "SubdomainOf",
            values: ["{{#split}}example.com,test.example.com,{{/split}}"],
          }
        ]

        expect(isInScope()).toBe(true)
      });
    })

    describe("keyinobjectlist", function () {
      it("matches if templating key is present in all list entries", () => {
        annotations = {
          "scope.cascading.securecodebox.io/CIDR": "127.0.0.0/8",
        }
        scopeLimiter.allOf = [
          {
            key: "scope.cascading.securecodebox.io/CIDR",
            operator: "InCIDR",
            values: ["{{#pickValues}}attributes.addresses.ip{{/pickValues}}"],
          }
        ]

        finding = {
          attributes: {
            addresses: [
              {
                "ip": "127.0.0.1"
              },
              {
                "ip": "fe80::4eb3:e128:53cc:5722"
              }
            ]
          }
        };

        expect(isInScope()).toBe(true);
      });

      it("does not match if list with invalid keys", () => {
        annotations = {
          "scope.cascading.securecodebox.io/CIDR": "127.0.0.0/8",
        }
        scopeLimiter.allOf = [
          {
            key: "scope.cascading.securecodebox.io/CIDR",
            operator: "InCIDR",
            values: ["{{#pickValues}}attributes.randomkey.ip{{/pickValues}}"],
          }
        ]

        finding = {}

        expect(isInScope()).toBe(false);
      });

      it("does not match if templating key is not present in all list entries", () => {
        annotations = {
          "scope.cascading.securecodebox.io/CIDR": "127.0.0.0/8",
        }
        scopeLimiter.allOf = [
          {
            key: "scope.cascading.securecodebox.io/CIDR",
            operator: "InCIDR",
            values: ["{{#pickValues}}attributes.addresses.ip{{/pickValues}}"],
          }
        ]

        finding = {
          attributes: {
            addresses: [
              {
                "ip": "127.0.0.1"
              },
              {
                "ip": "fe80::4eb3:e128:53cc:5722"
              },
              {
                "other_key": "test"
              }
            ]
          }
        };

        expect(isInScope()).toBe(false);
      });

      it("matches if validOnMissingRender is set and templating key is not present in all list entries", () => {
        annotations = {
          "scope.cascading.securecodebox.io/CIDR": "127.0.0.0/8",
        }
        scopeLimiter.validOnMissingRender = true
        scopeLimiter.allOf = [
          {
            key: "scope.cascading.securecodebox.io/CIDR",
            operator: "InCIDR",
            values: ["{{#pickValues}}attributes.addresses.ip{{/pickValues}}"],
          }
        ]

        finding = {
          attributes: {
            addresses: [
              {
                "ip": "127.0.0.1"
              },
              {
                "ip": "fe80::4eb3:e128:53cc:5722"
              },
              {
                "other_key": "test"
              }
            ]
          }
        };

        expect(isInScope()).toBe(true);
      });
    })

  })
})

describe("Operator", function () {
  describe("In", function () {
    it("matches if annotation is in value list", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domains": "www.example.com",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/domains",
          operator: "In",
          values: ["subdomain.example.com", "www.example.com"],
        }
      ]
      expect(isInScope()).toBe(true);
    });

    it("does not match if annotation is not in value list", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domains": "www.example.com",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/domains",
          operator: "In",
          values: ["subdomain.example.com", "example.com"],
        }
      ]
      expect(isInScope()).toBe(false);
    });
  })

  describe("Contains", function () {
    it("matches if value is in annotation list", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domains": "subdomain.example.com,www.example.com",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/domains",
          operator: "Contains",
          values: ["subdomain.example.com"],
        }
      ]
      expect(isInScope()).toBe(true);
    });

    it("does not match if value is not in annotation list", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domains": "subdomain.example.com,www.example.com",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/domains",
          operator: "Contains",
          values: ["example.com"],
        }
      ]
      expect(isInScope()).toBe(false);
    });

    it("does not match if one of the values is not in annotation list", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domains": "subdomain.example.com,www.example.com",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/domains",
          operator: "Contains",
          values: ["subdomain.example.com","example.com"],
        }
      ]
      expect(isInScope()).toBe(false);
    });
  });

  describe("InCIDR", function () {
    it("matches if ip in subnet", () => {
      annotations = {
        "scope.cascading.securecodebox.io/cidr": "10.0.0.0/16",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/cidr",
          operator: "InCIDR",
          values: ["10.0.1.0"],
        }
      ]
      expect(isInScope()).toBe(true);
    });

    it("does not match if ip not in subnet", () => {
      annotations = {
        "scope.cascading.securecodebox.io/cidr": "10.0.0.0/32",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/cidr",
          operator: "InCIDR",
          values: ["10.0.1.0"],
        }
      ]

      expect(isInScope()).toBe(false);
    });

    it("matches if ip in subnet (IPv6)", () => {
      annotations = {
        "scope.cascading.securecodebox.io/cidr": "2001:0:ce49:7601:e866:efff:62c3:fffe/16",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/cidr",
          operator: "InCIDR",
          values: ["2001:0:ce49:7601:e866:efff:62c3:ffff"],
        }
      ]

      expect(isInScope()).toBe(true);
    });

    it("matches if there is an IPv4/6 mismatch", () => {
      annotations = {
        "scope.cascading.securecodebox.io/cidr": "2001:0:ce49:7601:e866:efff:62c3:fffe/16",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/cidr",
          operator: "InCIDR",
          values: ["10.0.1.0"],
        }
      ]

      expect(isInScope()).toBe(true);
    });

    it("does not match if there is an IPv4/6 mismatch AND an out-of-scope IPv4/6 match", () => {
      annotations = {
        "scope.cascading.securecodebox.io/CIDR4": "127.0.0.0/8",
        "scope.cascading.securecodebox.io/CIDR6": "2001:0:ce49:7601:e866:efff:62c3:fffe/16",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/CIDR4",
          operator: "InCIDR",
          values: ["192.168.178.42"],
        },
        {
          key: "scope.cascading.securecodebox.io/CIDR6",
          operator: "InCIDR",
          values: ["192.168.178.42"],
        }
      ]
      expect(isInScope()).toBe(false);
    });

    it("does not match if there exist out-of-scope matched IPv4/6 entries", () => {
      annotations = {
        "scope.cascading.securecodebox.io/CIDR4": "127.0.0.0/8",
        "scope.cascading.securecodebox.io/CIDR6": "2001:0:ce49:7601:e866:efff:62c3:fffe/16",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/CIDR4",
          operator: "InCIDR",
          values: ["192.168.178.42", "2001:0:ce49:7601:e866:efff:62c3:fefe"],
        },
        {
          key: "scope.cascading.securecodebox.io/CIDR6",
          operator: "InCIDR",
          values: ["192.168.178.42", "2001:0:ce49:7601:e866:efff:62c3:fefe"],
        }
      ]
      expect(isInScope()).toBe(false);
    });

    it("matches if there exist only in-scope matched IPv4/6 entries", () => {
      annotations = {
        "scope.cascading.securecodebox.io/CIDR4": "127.0.0.0/8",
        "scope.cascading.securecodebox.io/CIDR6": "2001:0:ce49:7601:e866:efff:62c3:fffe/16",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/CIDR4",
          operator: "InCIDR",
          values: ["127.0.0.5", "2001:0:ce49:7601:e866:efff:62c3:fefe"],
        },
        {
          key: "scope.cascading.securecodebox.io/CIDR6",
          operator: "InCIDR",
          values: ["127.0.0.5", "2001:0:ce49:7601:e866:efff:62c3:fefe"],
        }
      ]
      expect(isInScope()).toBe(true);
    });

    it("throws error if IPv4 address is invalid even if scope is in IPv6", () => {
      annotations = {
        "scope.cascading.securecodebox.io/cidr": "2001:0:ce49:7601:e866:efff:62c3:fffe/16",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/cidr",
          operator: "InCIDR",
          values: ["10.0.0.257"], // Invalid IPv4
        }
      ]

      expect(isInScope).toThrowError("Bad characters detected in address: ..");
    });

    it("Throws error if IPv6 address is invalid even if scope is in IPv4", () => {
      annotations = {
        "scope.cascading.securecodebox.io/cidr": "10.0.0.0/16",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/cidr",
          operator: "InCIDR",
          values: ["2001:0:ce49:7601:e866:efff:62c3"],
        }
      ]

      expect(isInScope).toThrowError("Incorrect number of groups found");
    });
  });

  describe("SubdomainOf", function () {
    it("matches if is subdomain", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domain": "example.com",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/domain",
          operator: "SubdomainOf",
          values: ["subdomain.example.com"],
        }
      ]
      expect(isInScope()).toBe(true);
    });

    it("does not match if is not subdomain", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domain": "example.com",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/domain",
          operator: "SubdomainOf",
          values: ["notexample.com"],
        }
      ]
      expect(isInScope()).toBe(false);
    });

    it("matches if is the domain itself", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domain": "example.com",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/domain",
          operator: "SubdomainOf",
          values: ["example.com"],
        }
      ]
      expect(isInScope()).toBe(true);
    });

    it("matches if providing a sub-sub domain of a sub-domain", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domain": "www.example.com",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/domain",
          operator: "SubdomainOf",
          values: ["test.www.example.com"],
        }
      ]
      expect(isInScope()).toBe(true);
    });

    it("matches if providing a deep subdomain of a deep subdomain", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domain": "a.b.c.d.e.example.com",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/domain",
          operator: "SubdomainOf",
          values: ["z.a.b.c.d.e.example.com"],
        }
      ]
      expect(isInScope()).toBe(true);
    });

    it("does not match even if differences are deep in the subdomain tree", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domain": "a.b.c.d.e.example.com",
      }
      scopeLimiter.allOf = [
        {
          key: "scope.cascading.securecodebox.io/domain",
          operator: "SubdomainOf",
          values: ["z.b.c.d.e.example.com"],
        }
      ]
      expect(isInScope()).toBe(false);
    });

    it("does not match if providing a sub domain of a different sub-domain", () => {
      annotations = {
        "scope.cascading.securecodebox.io/domain": "www.example.com",
      }
      scopeLimiter.anyOf = [
        {
          key: "scope.cascading.securecodebox.io/domain",
          operator: "SubdomainOf",
          values: ["test.example.com"],
        }
      ]
      expect(isInScope()).toBe(false);
    });
  });
})

describe("ScopeLimiter", function () {
  it("does not match if one of selector types does not match", () => {
    annotations = {
      "scope.cascading.securecodebox.io/domains": "example.com",
    }
    scopeLimiter.allOf = [
      {
        key: "scope.cascading.securecodebox.io/domains",
        operator: "Contains",
        values: ["example.com"],
      }
    ]
    scopeLimiter.noneOf = [
      {
        key: "scope.cascading.securecodebox.io/domains",
        operator: "Contains",
        values: ["example.com"],
      }
    ]
    expect(isInScope()).toBe(false);
  });
})
