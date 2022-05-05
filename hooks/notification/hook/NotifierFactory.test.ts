// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { Finding } from "./model/Finding";
import { NotificationChannel } from "./model/NotificationChannel";
import { Scan } from "./model/Scan";
import { NotifierFactory } from "./NotifierFactory"
import { SlackNotifier } from "./Notifiers/SlackNotifier";
import { MSTeamsNotifier } from "./Notifiers/MSTeamsNotifier";
import { TrelloNotifier } from "./Notifiers/TrelloNotifier";
import { NotifierType } from "./NotifierType";

const finding: Finding = {
  name: "test finding",
  location: "hostname",
  category: "Open Port",
  severity: "high",
  osi_layer: "asdf",
  attributes: new Map(),
};

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

test("Should Create Slack Notifier", async () => {
  const chan: NotificationChannel = {
    name: "slack",
    type: NotifierType.SLACK,
    template: "template",
    rules: [],
    endPoint: "some.endpoint"
  }
  const findings: Finding[] = []
  findings.push(finding)
  const s = NotifierFactory.create(chan, scan, findings, []);

  expect(s instanceof SlackNotifier).toBe(true);
})

test("Should Create MS Teams Notifier", async () => {
  const chan: NotificationChannel = {
    name: "slack",
    type: NotifierType.MS_TEAMS,
    template: "template",
    rules: [],
    endPoint: "some.endpoint"
  }
  const findings: Finding[] = []
  findings.push(finding)

  const s = NotifierFactory.create(chan, scan, findings, []);

  expect(s instanceof MSTeamsNotifier).toBe(true);
})

test("Should Create Trello Notifier", async () => {
  const chan: NotificationChannel = {
    name: "trello",
    type: NotifierType.TRELLO,
    template: "template",
    rules: [],
    endPoint: "some.endpoint"
  }
  const findings: Finding[] = []
  findings.push(finding)

  const s = NotifierFactory.create(chan, scan, findings, []);

  expect(s instanceof TrelloNotifier).toBe(true);
})
