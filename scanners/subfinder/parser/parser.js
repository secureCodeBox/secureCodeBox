// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function parse(fileContent) {
  if (!fileContent)
    return [];

  const targets = parseResultFile(fileContent);
  return transformToFindings(targets);
}

function transformToFindings(targets) {
  return targets.map((item) => ({
      "name": item.host,
      "identified_at": null,
      "description": `Found subdomain ${item.host}`,
      "category": "Subdomain",
      "location": item.host,
      "osi_layer": "NETWORK",
      "severity": "INFORMATIONAL",
      "attributes": {
        "addresses": {
          "ip": item?.ip || null
        },
        "domain": item.input,
        "hostname": item.host,
        "ip_address": item?.ip || null,
        "source": item.source,
      }
    }
  ));
}

/**
 * Parses a given subfinder result file and extracts all targets
 * @param {*} fileContent
 */
function parseResultFile(fileContent) {
  return fileContent.trim()
                    .split('\n')
                    .map(line => JSON.parse(line));
}

module.exports.parse = parse;
