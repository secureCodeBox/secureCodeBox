// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const { isInScope } = require("./scope-limiter");

test("Should error if selecting an invalid key", () => {
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "engagement.scope/domains",
        operator: "Contains",
        values: ["{{attributes.hostname}}"],
      }
    ]
  }
  const finding = {
    attributes: {
      hostname: "example.com",
    }
  };

  const cascadedScans = () => isInScope(
    scopeLimiter,
    {},
    finding,
    {}
  );

  expect(cascadedScans).toThrowError("key 'engagement.scope/domains' is invalid: key does not start with 'scope.cascading.securecodebox.io/'");
});

test("Matches using templates populated with finding", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/domains": "example.com,subdomain.example.com",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domains",
        operator: "Contains",
        values: ["{{attributes.hostname}}"],
      }
    ]
  }
  const finding = {
    attributes: {
      hostname: "example.com",
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {}
  );

  expect(cascadedScans).toBe(true);
});

test("Does not match using if selector does not match", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/domains": "subdomain.example.com",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domains",
        operator: "Contains",
        values: ["{{attributes.hostname}}"],
      }
    ]
  }
  const finding = {
    attributes: {
      hostname: "example.com",
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {}
  );

  expect(cascadedScans).toBe(false);
});

test("Does not match if one of selector types does not match", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/domains": "example.com",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domains",
        operator: "Contains",
        values: ["{{attributes.hostname}}"],
      }
    ],
    noneOf: [
      {
        key: "scope.cascading.securecodebox.io/domains",
        operator: "Contains",
        values: ["{{attributes.hostname}}"],
      }
    ]
  }
  const finding = {
    attributes: {
      hostname: "example.com",
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {}
  );

  expect(cascadedScans).toBe(false);
});

test("Matches InCIDR if attributes.ip in subnet", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/cidr": "10.0.0.0/16",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/cidr",
        operator: "InCIDR",
        values: ["{{attributes.ip}}"],
      }
    ]
  }
  const finding = {
    attributes: {
      ip: "10.0.1.0",
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {}
  );

  expect(cascadedScans).toBe(true);
});

test("Does not match InCIDR if attributes.ip not in subnet", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/cidr": "10.0.0.0/32",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/cidr",
        operator: "InCIDR",
        values: ["{{attributes.ip}}"],
      }
    ]
  }
  const finding = {
    attributes: {
      ip: "10.0.1.0",
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {}
  );

  expect(cascadedScans).toBe(false);
});

test("Matches InCIDR if attributes.ip in subnet IPv6", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/cidr": "2001:0:ce49:7601:e866:efff:62c3:fffe/16",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/cidr",
        operator: "InCIDR",
        values: ["{{attributes.ip}}"],
      }
    ]
  }
  const finding = {
    attributes: {
      ip: "2001:0:ce49:7601:e866:efff:62c3:ffff",
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {}
  );

  expect(cascadedScans).toBe(true);
});

test("Matches InCIDR if there is an IPv4/6 mismatch", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/cidr": "2001:0:ce49:7601:e866:efff:62c3:fffe/16",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/cidr",
        operator: "InCIDR",
        values: ["{{attributes.ip}}"],
      }
    ]
  }
  const finding = {
    attributes: {
      ip: "10.0.1.0",
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {}
  );

  expect(cascadedScans).toBe(true);
});

test("Throws error if IPv4 address is invalid even if scope is in IPv6", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/cidr": "2001:0:ce49:7601:e866:efff:62c3:fffe/16",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/cidr",
        operator: "InCIDR",
        values: ["{{attributes.ip}}"],
      }
    ]
  }
  const finding = {
    attributes: {
      ip: "10.0.0.257", // Invalid IPv4
    }
  };

  const cascadedScans = () => isInScope(
    scopeLimiter,
    annotations,
    finding,
    {}
  );

  expect(cascadedScans).toThrowError("Bad characters detected in address: ..");
});


test("Throws error if IPv6 address is invalid even if scope is in IPv4", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/cidr": "10.0.0.0/16",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/cidr",
        operator: "InCIDR",
        values: ["{{attributes.ip}}"],
      }
    ]
  }
  const finding = {
    attributes: {
      ip: "2001:0:ce49:7601:e866:efff:62c3",
    }
  };

  const cascadedScans = () => isInScope(
    scopeLimiter,
    annotations,
    finding,
    {}
  );

  expect(cascadedScans).toThrowError("Incorrect number of groups found");
});

test("Matches using templates populated with finding and a mapped selector", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/domains": "example.com,subdomain.example.com",
  }
  const scopeLimiter = {
    requiresMapping: false,
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domains",
        operator: "Contains",
        values: ["{{$.hostname}}"],
      }
    ]
  }
  const finding = {
    attributes: {
      hostname: "example.com",
    }
  };

  const scopeLimiterAliases = {
    "hostname": "{{attributes.hostname}}",
  }

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    scopeLimiterAliases
  );

  expect(cascadedScans).toBe(true);
});

test("Matches if mapping is not available: validOnMissingRender true", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/domains": "example.com,subdomain.example.com",
  }
  const scopeLimiter = {
    validOnMissingRender: true,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domains",
        operator: "Contains",
        values: ["{{$.hostname}}"],
      }
    ]
  }

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    {},
    {},
  );

  expect(cascadedScans).toBe(true);
});

test("Does not match if mapping is not available: validOnMissingRender false", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/domains": "example.com,subdomain.example.com",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domains",
        operator: "Contains",
        values: ["{{$.hostname}}"],
      }
    ]
  }

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    {},
    {},
  );

  expect(cascadedScans).toBe(false);
});

test("Matches subdomainOf if is subdomain", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/domain": "example.com",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domain",
        operator: "SubdomainOf",
        values: ["{{attributes.hostname}}"],
      }
    ]
  }

  const finding = {
    attributes: {
      hostname: "subdomain.example.com",
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {},
  );

  expect(cascadedScans).toBe(true);
});

test("Matches subdomainOf if is the domain itself", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/domain": "example.com",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domain",
        operator: "SubdomainOf",
        values: ["{{attributes.hostname}}"],
      }
    ]
  }

  const finding = {
    attributes: {
      hostname: "example.com",
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {},
  );

  expect(cascadedScans).toBe(true);
});

test("Matches subdomainOf if providing a sub-sub domain of a sub-domain", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/domain": "www.example.com",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domain",
        operator: "SubdomainOf",
        values: ["{{attributes.hostname}}"],
      }
    ]
  }

  const finding = {
    attributes: {
      hostname: "test.www.example.com",
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {},
  );

  expect(cascadedScans).toBe(true);
});

test("Matches subdomainOf if providing a deep subdomain of a deep subdomain", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/domain": "a.b.c.d.e.example.com",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domain",
        operator: "SubdomainOf",
        values: ["{{attributes.hostname}}"],
      }
    ]
  }

  const finding = {
    attributes: {
      hostname: "z.a.b.c.d.e.example.com",
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {},
  );

  expect(cascadedScans).toBe(true);
});

test("Does not match subdomainOf even if differences are deep in the subdomain tree", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/domain": "a.b.c.d.e.example.com",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domain",
        operator: "SubdomainOf",
        values: ["{{attributes.hostname}}"],
      }
    ]
  }

  const finding = {
    attributes: {
      hostname: "z.b.c.d.e.example.com",
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {},
  );

  expect(cascadedScans).toBe(false);
});

test("Does not match subdomainOf if providing a sub domain of a different sub-domain", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/domain": "www.example.com",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domain",
        operator: "SubdomainOf",
        values: ["{{attributes.hostname}}"],
      }
    ]
  }

  const finding = {
    attributes: {
      hostname: "test.example.com",
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {},
  );

  expect(cascadedScans).toBe(false);
});

test("Does not match subdomainOf if is not subdomain", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/domain": "example.com",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domain",
        operator: "SubdomainOf",
        values: ["{{attributes.hostname}}"],
      }
    ]
  }

  const finding = {
    attributes: {
      hostname: "notexample.com",
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {},
  );

  expect(cascadedScans).toBe(false);
});

test("Throws errors when missing fields", () => {
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domain",
        operator: "In",
        values: ["{{attributes.hostname}}"],
      }
    ]
  }

  const finding = {
    attributes: {
      hostname: "notexample.com",
    }
  };

  const cascadedScans = () => isInScope(
    scopeLimiter,
    {},
    finding,
    {},
  );

  expect(cascadedScans).toThrowError("using operator 'In': the referenced annotation may not be undefined");
});

test("Test templating into a list from multiple subkeys", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/CIDR": "127.0.0.0/8",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/CIDR",
        operator: "InCIDR",
        values: ["{{#list}} attributes.addresses.ip {{/list}}"],
      }
    ]
  }

  const finding = {
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

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {},
  );

  expect(cascadedScans).toBe(true);
});

test("Templating into list fails if key is not present in all findings", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/CIDR": "127.0.0.0/8",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/CIDR",
        operator: "InCIDR",
        values: ["{{#list}} attributes.addresses.ip {{/list}}"],
      }
    ]
  }

  const finding = {
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

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {},
  );

  expect(cascadedScans).toBe(false);
});

test("Templating into list does not fail scope if validOnMissingRender is set and templating key is not present in all findings", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/CIDR": "127.0.0.0/8",
  }
  const scopeLimiter = {
    validOnMissingRender: true,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/CIDR",
        operator: "InCIDR",
        values: ["{{#list}} attributes.addresses.ip {{/list}}"],
      }
    ]
  }

  const finding = {
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

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {},
  );

  expect(cascadedScans).toBe(true);
});

test("Test matching both IPv4 and v6 addresses in CIDR", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/CIDR4": "127.0.0.0/8",
    "scope.cascading.securecodebox.io/CIDR6": "2001:0:ce49:7601:e866:efff:62c3:fffe/16",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/CIDR4",
        operator: "InCIDR",
        values: ["{{#list}} attributes.addresses.ip {{/list}}"],
      },
      {
        key: "scope.cascading.securecodebox.io/CIDR6",
        operator: "InCIDR",
        values: ["{{#list}} attributes.addresses.ip {{/list}}"],
      }
    ]
  }

  const finding = {
    attributes: {
      addresses: [
        {
          "ip": "127.0.0.5"
        },
        {
          "ip": "2001:0:ce49:7601:e866:efff:62c3:fefe"
        },
      ]
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {},
  );

  expect(cascadedScans).toBe(true);
});

test("Test failing one of the IPv4 and v6 addresses", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/CIDR4": "127.0.0.0/8",
    "scope.cascading.securecodebox.io/CIDR6": "2001:0:ce49:7601:e866:efff:62c3:fffe/16",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/CIDR4",
        operator: "InCIDR",
        values: ["{{#list}} attributes.addresses.ip {{/list}}"],
      },
      {
        key: "scope.cascading.securecodebox.io/CIDR6",
        operator: "InCIDR",
        values: ["{{#list}} attributes.addresses.ip {{/list}}"],
      }
    ]
  }

  const finding = {
    attributes: {
      addresses: [
        {
          "ip": "192.168.178.42"
        },
        {
          "ip": "2001:0:ce49:7601:e866:efff:62c3:fefe"
        },
      ]
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {},
  );

  expect(cascadedScans).toBe(false);
});

test("Test v6 constraint without v6 address present does not block the scope", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/CIDR4": "127.0.0.0/8",
    "scope.cascading.securecodebox.io/CIDR6": "2001:0:ce49:7601:e866:efff:62c3:fffe/16",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/CIDR4",
        operator: "InCIDR",
        values: ["{{#list}} attributes.addresses.ip {{/list}}"],
      },
      {
        key: "scope.cascading.securecodebox.io/CIDR6",
        operator: "InCIDR",
        values: ["{{#list}} attributes.addresses.ip {{/list}}"],
      }
    ]
  }

  const finding = {
    attributes: {
      addresses: [
        {
          "ip": "192.168.178.42"
        },
      ]
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {},
  );

  expect(cascadedScans).toBe(false);
});

test("Test templating list with invalid keys", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/CIDR": "127.0.0.0/8",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/CIDR",
        operator: "InCIDR",
        values: ["{{#list}}attributes.randomkey.ip{{/list}}"],
      }
    ]
  }

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    {},
    {},
  );

  expect(cascadedScans).toBe(false);
});

test("Test templating list with too short key", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/CIDR": "127.0.0.0/8",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/CIDR",
        operator: "InCIDR",
        values: ["{{#list}}attributes{{/list}}"],
      }
    ]
  }

  const cascadedScans = () => isInScope(
    scopeLimiter,
    annotations,
    {},
    {},
  );

  expect(cascadedScans).toThrowError("Invalid list key 'attributes'. List key must be at least 2 levels deep. E.g. 'attributes.addresses.ip'");
});

test("Test templating list of strings", () => {
  const annotations = {
    "scope.cascading.securecodebox.io/domain": "example.com",
  }
  const scopeLimiter = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "scope.cascading.securecodebox.io/domain",
        operator: "SubdomainOf",
        values: ["{{attributes.domains}}"],
      }
    ]
  }

  const finding = {
    attributes: {
      domains: ["example.com", "subdomain.example.com"],
    }
  };

  const cascadedScans = isInScope(
    scopeLimiter,
    annotations,
    finding,
    {},
  );

  expect(cascadedScans).toBe(true);
});
