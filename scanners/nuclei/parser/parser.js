// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const readJsonLines = require('read-json-lines-sync').default;

async function parse(fileContent) {
  // Only 0 when the target wasn't reachable
  if (fileContent.length === 0) {
    return [];
  }

  const jsonResult = readJsonLines(fileContent);

  return jsonResult.map(finding => {
    
    return {
      name: finding.info.name,
      description: "The name of the nuclei rule which triggered the finding: " + finding.templateID,
      location: finding.host,
      severity: getAdjustedSeverity(finding.info.severity.toUpperCase()),
      category: finding.templateID,
      attributes: {
        metadata: finding.meta || null,
        ip: finding.ip || null,
        timestamp: finding.timestamp || null,
        matcher_name: finding.matcher_name || null,
        matched: finding.matched || null,
        extracted_results:  finding.extracted_results || null,
        type: finding.type || null,
        tags: finding.tags || null,
        reference: finding.reference || null,
        author: finding.author || null,
      }
    };
  });
}

function getAdjustedSeverity(severity){
  return severity === "CRITICAL"
  ? "HIGH"
  : severity === "UNKNOWN"
  ? "INFORMATIONAL"
  : severity;
}

module.exports.parse = parse;
