import { NotifierType } from "../NotifierType";
import { EMailNotifier } from "./EMailNotifier";
import { NotificationChannel } from "../model/NotificationChannel";
import { Scan } from "../model/Scan";
import * as nodemailer from "nodemailer";

const sendMail = jest.fn();
const close = jest.fn();

jest.mock("nodemailer", () => {
  return {
    createTransport: () => {
      return {
        sendMail,
        close,
      }
    }
  };
});

test("Should Send Mail", async () => {

  const smtp =
    `
  host: smtp.ethereal.email
  port: 587
  secure: false
  auth:
    user: some_user
    pass: some_password
  from: mail@from.someone`
  process.env[EMailNotifier.SMTP_CONFIG] = smtp;
  const channel: NotificationChannel = {
    name: "Channel Name",
    type: NotifierType.EMAIL,
    template: "email",
    rules: [],
    endPoint: "mail@some.email"
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

  const notifier = new EMailNotifier(channel, scan, [], []);

  await notifier.sendMessage();

  expect(sendMail).toBeCalled();
  expect(close).toBeCalled();

})
