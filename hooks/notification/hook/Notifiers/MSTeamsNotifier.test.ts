// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

import { MSTeamsNotifier } from "./MSTeamsNotifier";
import axios from 'axios'
import { NotificationChannel } from "../model/NotificationChannel";
import { NotifierType } from "../NotifierType";
import { Scan } from "../model/Scan";

jest.mock('axios');

beforeEach(() => {
  jest.clearAllMocks();
})

const channel: NotificationChannel = {
  name: "Channel Name",
  type: NotifierType.MS_TEAMS,
  template: "msteams-messageCard",
  rules: [],
  endPoint: "https://iteratec.webhook.office.com/webhookb2/f2a7b22a-6558-4db5-8d4b-860f8d4c6848@e96afb08-eeaf-49be-90d6-526571a42d8a/IncomingWebhook/cd8d3c70bb504eb8b44385a8e0ebe6f5/812e82db-e6d9-4651-b0c8-3becfca82658"
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

  const teamsNotifier = new MSTeamsNotifier(channel, scan, [], []);
  teamsNotifier.sendMessage();
  expect(axios.post).toBeCalled();
});

test("Should Send Minimal Template For Empty Findings", async () => {
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
    },
    spec: {
      scanType: "Nmap",
      parameters: ["-Pn", "localhost"],
    },
    status: {
      findingDownloadLink:
        "https://my-secureCodeBox-instance.com/scan-b9as-sdweref--sadf-asdfsdf-dasdgf-asdffdsfa7/findings.json",
      findings: {},
      finishedAt: new Date("2020-05-25T02:38:13Z"),
      rawResultDownloadLink:
        "https://my-secureCodeBox-instance.com/scan-blkfsdg-sdgfsfgd-sfg-sdfg-dfsg-gfs98-e8af2172caa7/zap-results.json?Expires=1601691232",
      rawResultFile: "zap-results.json",
      rawResultType: "zap-json",
      state: "Done",
    },
  };

  const n = new MSTeamsNotifier(channel, scan, [], []);
  n.sendMessage();
  expect(axios.post).toBeCalled();
})
