// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

export async function parse(
  fileContent,
  scan,
  includeTargetDomain = process.env["INCLUDE_TARGET_DOMAIN"]?.toLowerCase() ==
    "true",
) {
  if (!fileContent && !includeTargetDomain) return [];

  const targets = parseResultFile(fileContent);
  const findings = transformToFindings(targets);

  const domain = includeTargetDomain
    ? getArgValue(scan.spec.parameters, "-d", "-domain")
    : null;
  if (domain) {
    findings.push(getTargetDomainFinding(domain));
  }

  return findings;
}

function getArgValue(args, ...flags) {
  const index = args.findIndex((arg) => flags.includes(arg));
  return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
}

function getTargetDomainFinding(domain) {
  return {
    name: domain,
    identified_at: null,
    description: `Found subdomain ${domain}`,
    category: "Subdomain",
    location: domain,
    osi_layer: "NETWORK",
    severity: "INFORMATIONAL",
    attributes: {
      domain: domain,
      hostname: domain,
      ip_address: null,
      ip_addresses: [],
      source: "parser",
    },
  };
}

function transformToFindings(targets) {
  return targets.map((item) => ({
    name: item.host,
    identified_at: null,
    description: `Found subdomain ${item.host}`,
    category: "Subdomain",
    location: item.host,
    osi_layer: "NETWORK",
    severity: "INFORMATIONAL",
    attributes: {
      domain: item.input,
      hostname: item.host,
      ip_address: item?.ip || null,
      ip_addresses: [item?.ip || null].filter(Boolean),
      source: item.source,
    },
  }));
}

/**
 * Parses a given subfinder result file and extracts all targets
 * @param {*} fileContent
 */
function parseResultFile(fileContent) {
  return fileContent
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
}
