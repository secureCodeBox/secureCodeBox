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
import * as Mustach from "mustache"
import { isMatch } from "lodash";
import { Finding } from "./model/Finding";
import { Notification } from "./model/Notification"
import { NotifierFactory } from "./NotifierFactory"

export async function handle({ }) {
  console.log("This Hook is working")
}


function matches(finding: Finding, rules: any): boolean {
  let matches = false;
  for (let rule of rules) {
    if (isMatch(finding, rule)) return true;
  }
  return false
}
