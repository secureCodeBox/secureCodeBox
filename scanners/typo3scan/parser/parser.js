// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function parse(findings) {
  let results = [];

  Object.keys(findings).forEach((key) => {
    const domain = key;
    const domain_findings = findings[domain];
    const vulns = domain_findings.Vulnerabilities;

    if (!vulns)
      // empty file
      return [];
    // Parsing Vulnerabilities
    const parsed_vulnerabilities = vulns.map((vuln) => {
      return {
        name: vuln.Type,
        description: `Vulnerability of type ${vuln.Type} found`,
        category: "Vulnerability",
        location: domain,
        osi_layer: "APPLICATION",
        severity: "HIGH",
        mitigation:
          "Follow the instructions in the advisory " +
          vuln["Advisory URL"] +
          " to fix the vulnerability.",
        attributes: {
          typo3_version: domain_findings.Version,
          advisory: vuln.Advisory,
          subcomponent: vuln.Subcomponent,
          versions_affected: vuln.Affected,
          advisory_url: vuln["Advisory URL"],
        },
      };
    });
    // Parsing Extenstions
    const extensions = domain_findings.Extensions;
    const parsed_extensions = extensions.map((ext) => {
      // Check if extension has vulnerabilities : if yes severity = HIGH
      let severity = "INFORMATIONAL";
      if (ext.Vulnerabilities.length > 0) {
        severity = "HIGH";
      }
      return {
        name: ext.Name,
        description: `Extension ${ext.Name} (${ext.Title}) found`,
        category: "Extension",
        location: ext.Url,
        osi_layer: "APPLICATION",
        severity: severity,
        attributes: {
          typo3_version: domain_findings.Version,
          repository: ext.Repo,
          extension_Version: ext.Version,
          version_file: ext["Version File"],
          vulnerabilities: ext.Vulnerabilities,
        },
      };
    });

    results = parsed_vulnerabilities.concat(parsed_extensions);
  });
  return results;
}
module.exports.parse = parse;
