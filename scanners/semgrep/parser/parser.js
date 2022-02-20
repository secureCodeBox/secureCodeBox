// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const severityMap = new Map([
  ["info", "INFORMATIONAL"],
  ["warning", "MEDIUM"],
  ["error", "HIGH"]
])
async function parse(fileContent) {
  const results = fileContent
  return results.results.flatMap(result => {
    // Assemble location as path to file and line range
    const location = result.path + ":" + result.start.line + "-" + result.end.line;
    
    // Name of the finding is the rule ID from semgrep
    const name = result.check_id

    // Description is either the message from result.extra.message, or a placeholder message
    const description = result.extra.message || "(No description provided in semgrep rule - when using a custom rule, set the 'message' key)"
    
    // Category of the finding - use either result.extra.metadata.category, or a placeholder
    const category = result.extra.metadata.category || "semgrep-result"

    // severity of the issue: translate semgrep severity levels (INFO, WARNING, ERROR) to those of SCB (INFORMATIONAL, LOW, MEDIUM, HIGH)
    const severity = severityMap.has(result.extra.severity.toLowerCase()) ? severityMap.get(result.extra.severity.toLowerCase()) : "INFORMATIONAL"

    const attributes = {
      // Common weakness enumeration, if available
      "cwe": result.extra.metadata.cwe || null,
      // OWASP category, if available
      "owasp_category": result.extra.metadata.owasp || null,
      // References given in the rule
      "references": result.extra.metadata.references || null,
      // Link to the semgrep rule
      "rule_source": result.extra.metadata.source || null,
      // Which line of code matched?
      // TODO: Do we actually want to record this? There are also secret-detector rules for semgrep, 
      // so maybe you don't actually want the plaintext match to be recorded unencrypted in some S3 bucket?
      // "matching_lines": result.extra.lines,
    }

    return {
      "name": name,
      "location": location,
      "description": description,
      "category": category,
      "severity": severity,
      "attributes": attributes
    }
  })
}

module.exports.parse = parse;
