// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import axios from "axios";
import { Scan } from "../model/Scan";
import { Finding } from "../model/Finding";
import { NotifierType } from "../NotifierType";
import { RocketChatNotifier } from "./RocketChat";
import { NotificationChannel } from "../model/NotificationChannel";

jest.mock("axios");

beforeEach(() => {
  jest.clearAllMocks();
});

const channel: NotificationChannel = {
  name: "Channel Name",
  type: NotifierType.ROCKET_CHAT,
  template: "rocket-chat",
  rules: [],
  endPoint: "https://rocketchat.example.com/api/v1/chat.postMessage",
};

function getTestData() {
  const scan: Scan = {
    metadata: {
      uid: "09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
      name: "demo-scan-1601086432",
      namespace: "my-scans",
      creationTimestamp: new Date("2021-01-01T14:29:25Z"),
      labels: {
        "attack-surface": "external",
      },
      annotations: {},
    },
    spec: {
      scanType: "Nmap",
      parameters: ["-Pn", "localhost"],
    },
    status: {
      findingDownloadLink:
        "https://my-secureCodeBox-instance.com/scan-b9as-sdweref--sadf-asdfsdf-dasdgf-asdffdsfa7/findings.json",
      findings: {
        categories: {
          "A Client Error response code was returned by the server": 1,
          "Information Disclosure - Sensitive Information in URL": 1,
          "Strict-Transport-Security Header Not Set": 1,
        },
        count: 3,
        severities: {
          high: 10,
          medium: 5,
          low: 2,
          informational: 1,
        },
      },
      finishedAt: new Date("2020-05-25T02:38:13Z"),
      rawResultDownloadLink:
        "https://my-secureCodeBox-instance.com/scan-blkfsdg-sdgfsfgd-sfg-sdfg-dfsg-gfs98-e8af2172caa7/zap-results.json?Expires=1601691232",
      rawResultFile: "zap-results.json",
      rawResultType: "zap-json",
      state: "Done",
    },
  };

  const findings: Finding[] = [
    {
      name: "foobar",
      description: "hello world",
      category: "Open Port",
      location: "http://example.com:22",
      osi_layer: "APPLICATION",
      severity: "Informational",
      attributes: {},
    },
  ];

  return { scan, findings };
}

test("Should Send Message With Findings And Severities", async () => {
  const { scan, findings } = getTestData();

  const rocketChatNotifier = new RocketChatNotifier(channel, scan, findings, {
    ROCKET_CHAT_AUTH_TOKEN: "foobar",
    ROCKET_CHAT_USER_ID: "barfoo",
    ROCKET_CHAT_DEFAULT_CHANNEL: "#securecodebox",
  });
  await rocketChatNotifier.sendMessage();

  expect(axios.post).toBeCalledWith(
    "https://rocketchat.example.com/api/v1/chat.postMessage",
    '{"channel":"#securecodebox","text":"New Scan Results for demo-scan-1601086432","attachments":[{"fields":[{"title":"- foobar","value":"hello world","short":false}]}]}',
    {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": "foobar",
        "X-User-Id": "barfoo",
      },
    }
  );
});

test("Should use channel overwrite from annotation if set", async () => {
  const { scan, findings } = getTestData();
  scan.metadata.annotations = {
    "notification.securecodebox.io/rocket-chat-channel": "#team-42-channel",
  };

  const rocketChatNotifier = new RocketChatNotifier(channel, scan, findings, {
    ROCKET_CHAT_AUTH_TOKEN: "foobar",
    ROCKET_CHAT_USER_ID: "barfoo",
    ROCKET_CHAT_DEFAULT_CHANNEL: "#securecodebox",
  });
  await rocketChatNotifier.sendMessage();

  expect(axios.post).toBeCalledWith(
    "https://rocketchat.example.com/api/v1/chat.postMessage",
    '{"channel":"#team-42-channel","text":"New Scan Results for demo-scan-1601086432","attachments":[{"fields":[{"title":"- foobar","value":"hello world","short":false}]}]}',
    {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": "foobar",
        "X-User-Id": "barfoo",
      },
    }
  );
});

test("Should include link back to defectdojo if set in finding", async () => {
  const { scan, findings } = getTestData();

  findings[0].attributes = {
    "defectdojo.org/finding-url": "https://defectdojo.example.com/finding/42",
  };

  const rocketChatNotifier = new RocketChatNotifier(channel, scan, findings, {
    ROCKET_CHAT_AUTH_TOKEN: "foobar",
    ROCKET_CHAT_USER_ID: "barfoo",
    ROCKET_CHAT_DEFAULT_CHANNEL: "#securecodebox",
  });
  await rocketChatNotifier.sendMessage();

  expect(axios.post).toBeCalledWith(
    "https://rocketchat.example.com/api/v1/chat.postMessage",
    '{"channel":"#securecodebox","text":"New Scan Results for demo-scan-1601086432","attachments":[{"fields":[{"title":"- foobar","value":"hello world [Open in DefectDojo](https://defectdojo.example.com/finding/42)","short":false}]}]}',
    {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": "foobar",
        "X-User-Id": "barfoo",
      },
    }
  );
});
