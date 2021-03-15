import { SlackNotifier } from "./SlackNotifier";

test("Should Send Minimal Message Slack", async () => {
  const slackNotifier = new SlackNotifier();
  await slackNotifier.init();
  const message = slackNotifier.sendMessage([]);
  expect(message).toBe({});
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
