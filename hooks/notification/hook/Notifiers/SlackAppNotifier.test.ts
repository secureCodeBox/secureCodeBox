// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { SlackAppNotifier } from "./SlackAppNotifier";
import axios from "axios";
import { NotificationChannel } from "../model/NotificationChannel";
import { NotifierType } from "../NotifierType";
import { Scan } from "../model/Scan";

jest.mock("axios");

beforeEach(() => {
  jest.clearAllMocks();
});

const channel: NotificationChannel = {
  name: "Channel Name",
  type: NotifierType.SLACK_APP,
  template: "slack-messageCard",
  rules: [],
};

test("Should Send Message With Findings And Severities", async () => {
  const scan: Scan = {
    metadata: {
      uid: "09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
      name: "demo-scan-1601086432",
      namespace: "my-scans",
      creationTimestamp: new Date("2021-01-01T14:29:25Z"),
      labels: {
        company: "iteratec",
        "attack-surface": "external",
      },
      annotations: {
        "notification.securecodebox.io/slack-channel": "#foobar",
      },
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

  const slackNotifier = new SlackAppNotifier(channel, scan, [], []);
  slackNotifier.sendMessage();
  expect(axios.post).toBeCalled();
});
