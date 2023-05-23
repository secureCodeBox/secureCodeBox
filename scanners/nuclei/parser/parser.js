// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function parse(fileContent) {
  // Only 0 when the target wasn't reachable
  if (fileContent.length === 0) {
    return [];
  }

  const jsonResult = readJsonLines(fileContent);

  return jsonResult.map((finding) => {
    const hostname = parseHostname(finding.host);
   // Add reference URLs to the references array
    const urlReferences = finding.info.reference ? finding.info.reference.flatMap(url => ({
      type: "URL",
      value: url
    })) : [];

    // Add CWE reference to the references array
    const cweIds = finding?.info?.classification?.["cwe-id"] ?? [];
    const cweReferences = cweIds.flatMap(cweId => [
      {
        type: "CWE",
        value: cweId.toUpperCase()
      },
      {
        type: "URL",
        value: `https://cwe.mitre.org/data/definitions/${cweId}.html`
      }
    ]);
    
    // Add CVE reference to the references array
    const cveIds = finding?.info?.classification?.["cve-id"] ?? [];
    const cveReferences = cveIds.flatMap(cveId => [
      {
        type: "CVE",
        value: cveId.toUpperCase()
      },
      {
        type: "URL",
        value: `https://nvd.nist.gov/vuln/detail/${cveId}`
      }
    ]);
  
      
  
    const references = [...urlReferences, ...cweReferences, ...cveReferences];

    const timestamp = finding.timestamp ? new Date(finding.timestamp).toISOString() : null;

    return {
      name: finding.info.name,
      description:
        finding.info?.description ??
        `The name of the nuclei rule which triggered the finding: ${finding["template-id"]}`,
      identified_at: timestamp,
      location: finding.host,
      severity: getAdjustedSeverity(finding?.info?.severity.toUpperCase()),
      category: finding["template-id"],
      references: references.length > 0 ? references : null, 
      attributes: {
        ip_addresses: finding.ip ? [finding.ip] : null,
        type: finding.type || null,
        hostname,
        path: finding.path || null,

        tags: finding.info?.tags || null,
        reference: finding.info?.reference || null,
        author: finding.info?.author || null,
        metadata: finding.info?.metadata || null,
        timestamp: finding.timestamp || null,

        matcher_status: finding["matcher-status"] || null,
        matcher_name: finding["matcher-name"] || null,
        matched_at: finding["matched-at"] || null,
        matched_line: finding["matched-line"] || null,
        extracted_results: finding["extracted-results"] || null,

        template: finding["template"],
        template_url: finding["template-url"],
        template_id: finding["template-id"],

        // request & responses are included when nuclei is run with `-include-rr` / `-irr`
        request: finding.request || null,
        response: finding.response || null,
        curl_command: finding["curl-command"] || null,
      },
    };
  });
}

function parseHostname(host) {
  if (!host) {
    return null;
  }

  try {
    const url = new URL(host);
    return url.hostname;
  } catch (err) {
    console.warn(`Failed to parse hostname from host: "${host}"`);
  }
}

function getAdjustedSeverity(severity) {
  switch (severity) {
    case "CRITICAL":
      return "HIGH";
    case "INFO":
      return "INFORMATIONAL";
    case "UNKNOWN":
      return "LOW";
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
    return [];
  }
}

module.exports.parse = parse;
