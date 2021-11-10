// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const { isReverseMatch } = require("./reverse-matches");

test("Matches using templates populated with finding", () => {
  const annotations = {
    "engagement.scope/domains": "example.com,subdomain.example.com",
  }
  const scanAnnotationSelector = {
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

  const cascadedScans = isReverseMatch(
    scanAnnotationSelector,
    annotations,
    finding,
    {}
  );

  expect(cascadedScans).toBe(true);
});

test("Does not match using if selector does not match", () => {
  const annotations = {
    "engagement.scope/domains": "subdomain.example.com",
  }
  const scanAnnotationSelector = {
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

  const cascadedScans = isReverseMatch(
    scanAnnotationSelector,
    annotations,
    finding,
    {}
  );

  expect(cascadedScans).toBe(false);
});

test("Matches InCIDR if attributes.ip in subnet", () => {
  const annotations = {
    "engagement.scope/cidr": "10.0.0.0/16",
  }
  const scanAnnotationSelector = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "engagement.scope/cidr",
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

  const cascadedScans = isReverseMatch(
    scanAnnotationSelector,
    annotations,
    finding,
    {}
  );

  expect(cascadedScans).toBe(true);
});

test("Does not match InCIDR if attributes.ip not in subnet", () => {
  const annotations = {
    "engagement.scope/cidr": "10.0.0.0/32",
  }
  const scanAnnotationSelector = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "engagement.scope/cidr",
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

  const cascadedScans = isReverseMatch(
    scanAnnotationSelector,
    annotations,
    finding,
    {}
  );

  expect(cascadedScans).toBe(false);
});

test("Matches using templates populated with finding and a mapped selector", () => {
  const annotations = {
    "engagement.scope/domains": "example.com,subdomain.example.com",
  }
  const scanAnnotationSelector = {
    requiresMapping: false,
    validOnMissingRender: false,
    allOf: [
      {
        key: "engagement.scope/domains",
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

  const selectorAttributeMappings = {
    "hostname": "{{attributes.hostname}}",
  }

  const cascadedScans = isReverseMatch(
    scanAnnotationSelector,
    annotations,
    finding,
    selectorAttributeMappings
  );

  expect(cascadedScans).toBe(true);
});

test("Matches if mapping is not available: validOnMissingRender true", () => {
  const annotations = {
    "engagement.scope/domains": "example.com,subdomain.example.com",
  }
  const scanAnnotationSelector = {
    validOnMissingRender: true,
    allOf: [
      {
        key: "engagement.scope/domains",
        operator: "Contains",
        values: ["{{$.hostname}}"],
      }
    ]
  }

  const cascadedScans = isReverseMatch(
    scanAnnotationSelector,
    annotations,
    {},
    {},
  );

  expect(cascadedScans).toBe(true);
});

test("Does not match if mapping is not available: validOnMissingRender false", () => {
  const annotations = {
    "engagement.scope/domains": "example.com,subdomain.example.com",
  }
  const scanAnnotationSelector = {
    validOnMissingRender: false,
    allOf: [
      {
        key: "engagement.scope/domains",
        operator: "Contains",
        values: ["{{$.hostname}}"],
      }
    ]
  }

  const cascadedScans = isReverseMatch(
    scanAnnotationSelector,
    annotations,
    {},
    {},
  );

  expect(cascadedScans).toBe(false);
});
