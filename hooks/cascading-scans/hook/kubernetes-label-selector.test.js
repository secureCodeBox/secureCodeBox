// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const {generateSelectorString} = require("./kubernetes-label-selector");

test("should generate a empty string if passed an empty object", () => {
  expect(generateSelectorString({})).toBe("");
});

test("should generate basic label string for key values selector", () => {
  expect(
    generateSelectorString({
      matchLabels: {environment: "production"},
    })
  ).toBe("environment=production");

  expect(
    generateSelectorString({
      matchLabels: {environment: "testing"},
    })
  ).toBe("environment=testing");
});

test("should generate basic label string for multiple key values selector", () => {
  expect(
    generateSelectorString({
      matchLabels: {
        environment: "production",
        team: "search",
      },
    })
  ).toBe("environment=production,team=search");

  expect(
    generateSelectorString({
      matchLabels: {
        environment: "testing",
        team: "payment",
      },
    })
  ).toBe("environment=testing,team=payment");
});

test("should generate label string for set based expressions", () => {
  expect(
    generateSelectorString({
      matchExpressions: [
        {
          key: "environment",
          operator: "In",
          values: ["testing", "development"],
        },
      ],
    })
  ).toBe("environment in (testing,development)");

  expect(
    generateSelectorString({
      matchExpressions: [
        {
          key: "environment",
          operator: "In",
          values: ["development"],
        },
      ],
    })
  ).toBe("environment in (development)");
});

test("should generate label string for set based expressions with multiple entries", () => {
  expect(
    generateSelectorString({
      matchExpressions: [
        {
          key: "environment",
          operator: "NotIn",
          values: ["production"],
        },
        {
          key: "team",
          operator: "In",
          values: ["search", "payment"],
        },
      ],
    })
  ).toBe("environment notin (production),team in (search,payment)");
});

test("should generate label string for set based Exists and DoesNotExist operators", () => {
  expect(
    generateSelectorString({
      matchExpressions: [
        {
          key: "environment",
          operator: "Exists",
        },
        {
          key: "team",
          operator: "DoesNotExist",
        },
      ],
    })
  ).toBe("environment,!team");
});

test("should generate selectors with both expression and labelMatching", () => {
  expect(
    generateSelectorString({
      matchExpressions: [
        {
          key: "environment",
          operator: "NotIn",
          values: ["production"],
        },
        {
          key: "team",
          operator: "In",
          values: ["search", "payment"],
        },
        {
          key: "foobar",
          operator: "Exists",
        },
        {
          key: "barfoo",
          operator: "DoesNotExist",
        },
      ],
      matchLabels: {
        critical: "true",
      },
    })
  ).toBe(
    "critical=true,environment notin (production),team in (search,payment),foobar,!barfoo"
  );
});

test("should throw a exception when passed a unknown operator", () => {
  expect(() =>
    generateSelectorString({
      matchExpressions: [
        {
          key: "environment",
          operator: "FooBar",
          values: ["production"],
        },
      ],
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Unknown LabelSelector Operator "FooBar". Supported are (In, NotIn, Exists, DoesNotExist). If this is an official label selector operator in kubernetes please open up a issue in the secureCodeBox Repo."`
  );
});
