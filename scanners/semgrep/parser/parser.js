// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const severityMap = new Map([
  ["info", "INFORMATIONAL"],
  ["warning", "MEDIUM"],
  ["error", "HIGH"]
])
async function parse(fileContent) {
  const results = fileContent;
  return results.results.flatMap(result => {
    // Assemble location as path to file and line range
    const location = result.path + ":" + result.start.line + "-" + result.end.line;
    
    // Name of the finding is the rule ID from semgrep
    const name = result.check_id

    // Description is either the message from result.extra.message, or a placeholder message
    const description = result.extra.message || "(No description provided in semgrep rule - when using a custom rule, set the 'message' key)"
    
    // Category of the finding - use either result.extra.metadata.category, or a placeholder
    // TODO: What is a good placeholder if none is set in the rule? null / empty string / "semgrep"?
    const category = result.extra.metadata.category || null

    // severity of the issue: translate semgrep severity levels (INFO, WARNING, ERROR) to those of SCB (INFORMATIONAL, LOW, MEDIUM, HIGH)
    // TODO: What to return if the severity is not set, or not set to a valid value? null / empty string / ...?
    const severity = severityMap.has(result.extra.severity.toLowerCase()) ? severityMap.get(result.extra.severity.toLowerCase()) : null

    const attributes = {
    }
    return {
      "name": name,
      "location": location,
      "description": description,
      "category": category,
      "severity": severity,
    }
  })
}

module.exports.parse = parse;
// Debugging:
const buffer = require("./__testFiles__/minimal-metadata.json");
parse(buffer).then((result) => {console.log(JSON.stringify(result, null, 2))});


// Semgrep: INFO / WARNING / ERROR
// SCB: INFORMATIONAL / LOW / MEDIUM / HIGH