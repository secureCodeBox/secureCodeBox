// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import * as path from "path";
import { matches, getNotificationChannels, mapToEndPoint } from "./hook";
import { Finding } from "./model/Finding";
import { NotificationChannel } from "./model/NotificationChannel";
import { NotifierType } from "./NotifierType";

test("Should Match for High Severity Findings", async () => {
  const finding: Finding = {
    name: "test finding",
    description: "test finding description",
    location: "hostname",
    category: "Open Port",
    severity: "high",
    osi_layer: "asdf",
    attributes: new Map(),
  };

  const rules = [{
    matches: {
      anyOf: [
        {
          severity: "high"
        }
      ]
    },
  }]
  expect(matches(finding, rules)).toBeTruthy();
})

test("Should Not Match for High Severity Findings", async () => {
  const finding: Finding = {
    name: "test finding",
    description: "test finding description",
    location: "hostname",
    category: "Open Port",
    severity: "high",
    osi_layer: "asdf",
    attributes: new Map(),
  };

  const rules = [{
    matches: {
      anyOf: [
        {
          severity: "NOT HIGH"
        }
      ]
    },
  }]
  expect(matches(finding, rules)).toBeFalsy();

})

test("Should Match for Multiple 'anyOf' Rules", async () => {
  const finding: Finding = {
    name: "test finding",
    description: "test finding description",
    location: "hostname",
    category: "Open Port",
    severity: "high",
    osi_layer: "asdf",
    attributes: new Map(),
  };

  const rules = [{
    matches: {
      anyOf: [
        {
          severity: "NOT HIGH"
        },
        {
          category: "Open Port",
        }
      ]
    },
  }]
  expect(matches(finding, rules)).toBeTruthy();
})

test("Should NOT Match Multiple 'anyOf' Rules", async () => {
  const finding: Finding = {
    name: "test finding",
    description: "test finding description",
    location: "hostname",
    category: "Open Port",
    severity: "high",
    osi_layer: "asdf",
    attributes: new Map(),
  };

  const rules = [{
    matches: {
      anyOf: [
        {
          severity: "NOT HIGH"
        },
        {
          category: "NOT OPEN PORT"
        }
      ]
    },
  }]

  expect(matches(finding, rules)).toBeFalsy();
})

test("Should Match Multiple 'and' Rules", async () => {
  const finding: Finding = {
    name: "test finding",
    description: "test finding description",
    location: "hostname",
    category: "Open Port",
    severity: "high",
    osi_layer: "asdf",
    attributes: new Map(),
  };

  const rules = [
    {
      matches: {
        anyOf: [
          {
            severity: "high"
          }
        ]
      },
    },
    {
      matches: {
        anyOf: [
          {
            category: "Open Port"
          }
        ]
      },
    },
  ]

  expect(matches(finding, rules)).toBeTruthy();
})

test("Should Not Match Multiple 'and' Rules", async () => {
  const finding: Finding = {
    name: "test finding",
    description: "test finding description",
    location: "hostname",
    category: "Open Port",
    severity: "high",
    osi_layer: "asdf",
    attributes: new Map(),
  };

  const rules = [
    {
      matches: {
        anyOf: [
          {
            severity: "high"
          }
        ]
      },
    },
    {
      matches: {
        anyOf: [
          {
            severity: "low"
          }
        ]
      },
    },
  ]

  expect(matches(finding, rules)).toBeFalsy();
})

test("Should Match If No Rules Provided", async () => {
  const finding: Finding = {
    name: "test finding",
    description: "test finding description",
    location: "hostname",
    category: "Open Port",
    severity: "high",
    osi_layer: "asdf",
    attributes: new Map(),
  };
  const rules = [];

  expect(matches(finding, rules)).toBeTruthy()
})

test("Should Return Channels", async () => {
  const channelFile = path.join(__dirname, "./__testfiles__/channels.yaml")
  const channels = getNotificationChannels(channelFile) as NotificationChannel[];
  const c: NotificationChannel = {
    name: "slack",
    type: NotifierType.SLACK,
    template: "messageCard",
    rules: [],
    endPoint: "some.url"
  }
  const expected: NotificationChannel[] = [];
  expected.push(c)
  expect(channels).toStrictEqual(expected);
})

test("Should Map Env Name To endPoint", async () => {
  const expectedEndPoint = 'webhook.site';
  process.env["TEST_ENDPOINT"] = expectedEndPoint;

  const endpoint = mapToEndPoint("TEST_ENDPOINT");

  expect(endpoint).toBe(expectedEndPoint);
});
