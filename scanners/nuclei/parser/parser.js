// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

async function parse(fileContent) {
  // Only 0 when the target wasn't reachable
  if (fileContent.length === 0) {
    return [];
  }

  const jsonResult = readJsonLines(fileContent);

  return jsonResult.map((finding) => {
    return {
      name: finding.info.name,
      description:
        "The name of the nuclei rule which triggered the finding: " +
        finding.templateID,
      location: finding.host,
      severity: getAdjustedSeverity(finding.info.severity.toUpperCase()),
      category: finding.templateID,
      attributes: {
        metadata: finding.meta || null,
        ip: finding.ip || null,
        timestamp: finding.timestamp || null,
        matcher_name: finding.matcher_name || null,
        matched: finding.matched || null,
        extracted_results: finding.extracted_results || null,
        type: finding.type || null,
        tags: finding.tags || null,
        reference: finding.reference || null,
        author: finding.author || null,
      },
    };
  });
}

function getAdjustedSeverity(severity) {
  switch (severity) {
    case "CRITICAL":
      return "HIGH";
    case "INFO":
    case "UNKNOWN":
      return "INFORMATIONAL";
    default:
      return severity;
  }
}

function readJsonLines(jsonl) {
  if (typeof jsonl === "string" || jsonl instanceof String) {
    return jsonl
      .split("\n")
      .filter((line) => line)
      .map((line) => line.trim())
      .map((line) => JSON.parse(line));
  } else if (typeof jsonl === "object") {
    // If nuclei identifies a single result it will be automatically parsed as a json object by the sdk & underlying http lib (axios)
    return [jsonl];
  } else {
    return []
  }
}

module.exports.parse = parse;
