import { SlackNotifier } from "./SlackNotifier";
import axios from 'axios'
import { NotificationChannel } from "../model/NotificationChannel";
import { NotifierType } from "../NotifierType";

jest.mock('axios');

test.only("Should Send Minimal Message Slack", async () => {
  const channel: NotificationChannel = {
    name: "Channel Name",
    type: NotifierType.SLACK,
    templateName: "messageCard",
    rules: [],
    endPoint: "https://webhook.site/85040864-7cf4-4a3a-8aa9-34c1fb7c66ba"
  };
  const slackNotifier = new SlackNotifier(channel);
  slackNotifier.sendMessage([]);
  expect(axios.post).toHaveBeenCalledWith("");
});

test("Should Send Post Request with Findings", async () => {
  expect(true).toBe(false)
})

test("Should Send Minimal Template For Empty Findings", async () => {
  expect(true).toBe(false)
})

test("Should Include Link To Kibana Dashboard", async () => {
  expect(true).toBe(false)
})

test("Should Include Link To DefectDojo Project", async () => {
  expect(true).toBe(false)
})

test("Should Only Send Post Request for Matching Rules", async () => {
  expect(true).toBe(false)
})

test("Should Apply Custom Template", async () => {
  expect(true).toBe(false)
})

test("Should Send Minimal Template For Disabled VulnerabilityManagement", async () => {
  expect(true).toBe(false)
})

test("Should Send Minimal Template For Incomplete VulnerabilityManagement Configuration", async () => {
  expect(true).toBe(false)
})

test("Should Only Send Post Request For High Severity Findings", async () => {
  expect(true).toBe(false)
})
