/**
Copyright 2020 iteratec GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
import { isMatch } from "lodash";
import { Finding } from "./model/Finding";
import { NotificationChannel } from "./model/NotificationChannel";
import { Notifier } from "./Notifier";
import { NotifierFactory } from "./NotifierFactory";
import { readFileSync } from 'fs';
import * as jsyaml from 'js-yaml';

const BASE_PATH = "/home/app/config"
const CHANNEL_FILE = `${BASE_PATH}/notification-channel.yaml`;
const ARGS_FILE = `${BASE_PATH}/args`

export async function handle({ getFindings, scan }) {
  let findings: Finding[] = await getFindings();
  let notificationChannels: NotificationChannel[] = getNotificationChannels(CHANNEL_FILE);
  let args: any[] = getArgs(ARGS_FILE);
  for (const channel of notificationChannels) {
    const findingsToNotify = findings.filter(finding => matches(finding, channel.rules));
    const notifier: Notifier = NotifierFactory.create(channel, scan, findingsToNotify, args);
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
  const notificationChannels = jsyaml.load(yaml.toString())
  return notificationChannels as any[];
}

function doesNotMatch(rule: any, finding: Finding): boolean {
  return !rule.matches.anyOf.some((condition: object) => isMatch(finding, condition));
}

function getArgs(argsFile: string): any[] {
  const yaml = readFileSync(argsFile);
  return jsyaml.load(yaml.toString()) as any[]
}
