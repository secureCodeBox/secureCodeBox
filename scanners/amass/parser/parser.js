// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function parse(fileContent) {
  let identifiedDomains = [];

  if (typeof fileContent === "string") {
    identifiedDomains = fileContent
      .split("\n")
      .filter(Boolean)
      .map((domainJson) => JSON.parse(domainJson));
  } else if (typeof fileContent === "object") {
    // If amass identifies a single result it will be automatically parsed as a json object by the sdk & underlying http lib (axios)
    identifiedDomains = [fileContent];
  }

  return identifiedDomains.map((domain) => {
    return {
      name: domain.name,
      identified_at: domain.Timestamp,
      description: `Found subdomain ${domain.name}`,
      category: "Subdomain",
      location: domain.name,
      osi_layer: "NETWORK",
      severity: "INFORMATIONAL",
      attributes: {
        tag: domain.tag,
        name: domain.name,
        source: domain.source,
        domain: domain.domain,
        addresses: domain.addresses,
      },
    };
  });
}

module.exports.parse = parse;
