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
