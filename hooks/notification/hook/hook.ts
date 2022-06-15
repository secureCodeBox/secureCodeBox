// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0
import { isMatch } from "lodash";
import { Finding } from "./model/Finding";
import { NotificationChannel } from "./model/NotificationChannel";
import { Notifier } from "./Notifier";
import { NotifierFactory } from "./NotifierFactory";
import { readFileSync } from "fs";
import * as jsyaml from "js-yaml";

const BASE_PATH = "/home/app/config";
const CHANNEL_FILE = `${BASE_PATH}/notification-channel.yaml`;

export async function handle({ getFindings, scan }) {
  let findings: Finding[] = await getFindings();
  let notificationChannels: NotificationChannel[] =
    getNotificationChannels(CHANNEL_FILE);
  let args: Object = getArgs();
  for (const channel of notificationChannels) {
    const findingsToNotify = findings.filter(finding => matches(finding, channel.rules));

    const findingsToNotify = findings.filter((finding) =>
      matches(finding, channel.rules)
    );

    if (
      channel.skipNotificationOnZeroFindings === true &&
      findingsToNotify.length === 0
    ) {
      continue;
    }

    const notifier: Notifier = NotifierFactory.create(
      channel,
      scan,
      findingsToNotify,
      args
    );
    await notifier.sendMessage();
  }
}

/**
 * Checks if a finding is matching a set of rules
 * @param finding
 * @param rules
 * @returns False if not matching, True if no rules specified or matching
 */
export function matches(finding: Finding, rules: any[]): boolean {
  if (rules == null || rules.length === 0) return true;
  for (let rule of rules) {
    if (doesNotMatch(rule, finding)) return false;
  }
  return true;
}

export function getNotificationChannels(channelFile: string): any[] {
  const yaml = readFileSync(channelFile);
  const notificationChannels = jsyaml.load(yaml.toString());
  return notificationChannels as any[];
}

function doesNotMatch(rule: any, finding: Finding): boolean {
  return !rule.matches.anyOf.some((condition: object) =>
    isMatch(finding, condition)
  );
}

function getArgs(): Object {
  return process.env;
}

export function mapToEndPoint(envName: string) {
  return process.env[envName];
}
