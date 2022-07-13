// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

import { NotifierType } from "../NotifierType";
import { EMailNotifier } from "./EMailNotifier";
import { NotificationChannel } from "../model/NotificationChannel";
import { Scan } from "../model/Scan";

const sendMail = jest.fn();
const close = jest.fn();

jest.mock("nodemailer", () => {
  return {
    createTransport: () => {
      return {
        sendMail,
        close,
      };
    },
  };
});

const creationTimestamp = new Date("2021-01-01T14:29:25Z");

function createExampleScan(): Scan {
  return {
    metadata: {
      uid: "09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
      name: "demo-scan-1601086432",
      namespace: "my-scans",
      creationTimestamp,
      labels: {
        company: "iteratec",
        "attack-surface": "external",
      },
    },
    spec: {
      scanType: "nmap",
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
}

test("Should Send Mail", async () => {
  const from = "secureCodeBox";
  const smtp = "smtp://user:pass@smtp.ethereal.email/";
  process.env[EMailNotifier.SMTP_CONFIG] = smtp;
  const channel: NotificationChannel = {
    name: "Channel Name",
    type: NotifierType.EMAIL,
    template: "email",
    rules: [],
    endPoint: "mail@some.email",
  };
  const scan: Scan = createExampleScan();

  const args = new Array();
  args[EMailNotifier.EMAIL_FROM] = from;

  const notifier = new EMailNotifier(channel, scan, [], args);

  await notifier.sendMessage();

  expect(sendMail).toBeCalledWith({
    from: "secureCodeBox",
    html: `<strong>Scan demo-scan-1601086432</strong><br>
Created at ${creationTimestamp.toString()}
<br>
<br>
<strong>Findings Severity Overview:</strong><br>
high: 10<br>
medium: 5<br>
low: 2<br>
informational: 1<br>

<br>
<strong>Findings Category Overview:</strong><br>
A Client Error response code was returned by the server: 1<br>
Information Disclosure - Sensitive Information in URL: 1<br>
Strict-Transport-Security Header Not Set: 1<br>
`,
    subject: "New nmap security scan results are available!",
    text: `*Scan demo-scan-1601086432*
Created at ${creationTimestamp.toString()}

*Findings Severity Overview*:
high: 10
medium: 5
low: 2
informational: 1

*Findings Category Overview*:
A Client Error response code was returned by the server: 1
Information Disclosure - Sensitive Information in URL: 1
Strict-Transport-Security Header Not Set: 1
`,
    to: "mail@some.email",
  });
  expect(close).toBeCalled();
});

test("should send mail to recipient overwritten in scan annotation", async () => {
  const from = "secureCodeBox";
  const smtp = "smtp://user:pass@smtp.ethereal.email/";
  process.env[EMailNotifier.SMTP_CONFIG] = smtp;
  const channel: NotificationChannel = {
    name: "Channel Name",
    type: NotifierType.EMAIL,
    template: "email",
    rules: [],
    endPoint: "mail@some.email",
  };
  const scan: Scan = createExampleScan();
  scan.metadata.annotations = {
    "notification.securecodebox.io/email-recipient": "foo@example.com",
  };

  const args = new Array();
  args[EMailNotifier.EMAIL_FROM] = from;

  const notifier = new EMailNotifier(channel, scan, [], args);

  await notifier.sendMessage();

  expect(sendMail).toBeCalledWith({
    from: "secureCodeBox",
    html: `<strong>Scan demo-scan-1601086432</strong><br>
Created at ${creationTimestamp.toString()}
<br>
<br>
<strong>Findings Severity Overview:</strong><br>
high: 10<br>
medium: 5<br>
low: 2<br>
informational: 1<br>

<br>
<strong>Findings Category Overview:</strong><br>
A Client Error response code was returned by the server: 1<br>
Information Disclosure - Sensitive Information in URL: 1<br>
Strict-Transport-Security Header Not Set: 1<br>
`,
    subject: "New nmap security scan results are available!",
    text: `*Scan demo-scan-1601086432*
Created at ${creationTimestamp.toString()}

*Findings Severity Overview*:
high: 10
medium: 5
low: 2
informational: 1

*Findings Category Overview*:
A Client Error response code was returned by the server: 1
Information Disclosure - Sensitive Information in URL: 1
Strict-Transport-Security Header Not Set: 1
`,
    to: "foo@example.com",
  });
  expect(close).toBeCalled();
});
