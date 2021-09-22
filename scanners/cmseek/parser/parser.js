// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

async function parse(findings) {
  let results = []
  // Making sure the CMS is Joomla
  if (findings.cms_id == "joom") {

    // Check if debug mode is enabled ; if yes add finding
    let parsed_debug_mode_enabled = []
    if (("joomla_debug_mode" in findings) && (findings.joomla_debug_mode == "enabled")) {
      parsed_debug_mode_enabled = {
        name: "Debug mode",
        description: `Debug mode is enabled on the site`,
        category: "Security Misconfiguration",
        location: findings.url,
        osi_layer: "APPLICATION",
        severity: "MEDIUM",
        attributes: {
          joomla_version: findings.joomla_version,
        }
      }
    }

    // Check if backup files are open; if yes add finding
    let parsed_backupFiles = []
    if (("joomla_backup_files" in findings) && (findings.joomla_backup_files.length > 0)) {
      parsed_backupFiles = {
        name: "Backup files",
        description: `Visible Backup files found`,
        category: "Visible internal files",
        location: findings.url,
        osi_layer: "APPLICATION",
        severity: "INFORMATIONAL",
        attributes: {
          joomla_version: findings.joomla_version,
          joomla_backup_files: findings.joomla_backup_files
        }
      }
    }
    // Check if any core vulnerabilities exist; if yes list findings
    let parsed_vulnerabilities = []
    if (findings.vulnerabilities_count > 0) {
      const vulns = findings.vulnerabilities
      parsed_vulnerabilities = vulns.map((vuln) => {
        return {
          name: vuln.name,
          description: `Vulnerability of type ${vuln.name} found`,
          category: "Vulnerability",
          location: findings.url,
          osi_layer: "APPLICATION",
          severity: "HIGH",
          attributes: {
            joomla_version: findings.joomla_version,
            references: vuln.references,
          }
        };
      });
    }
    // concat all parsed results
    results = parsed_vulnerabilities.concat(parsed_backupFiles).concat(parsed_debug_mode_enabled)
  }
  return results
}
module.exports.parse = parse;
