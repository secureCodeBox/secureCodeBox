// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function parse(findings) {
  let results = []
  // Making sure the CMS is Joomla
  if (findings.cms_id != "joom") {
    return results
  }
  // Check if debug mode is enabled ; if yes add finding
  let parsed_debug_mode_enabled = []
  if (findings.joomla_debug_mode == "enabled") {
    parsed_debug_mode_enabled = {
      name: "Debug mode",
      identified_at: findings.last_scanned,
      description: `Debug mode is enabled on the site`,
      category: "Security Misconfiguration",
      location: findings.url,
      osi_layer: "APPLICATION",
      severity: "MEDIUM",
    }
  }

  // Check if backup files are open; if yes add finding
  let parsed_backupFiles = []
  if ("joomla_backup_files" in findings) {
    parsed_backupFiles = {
      name: "Backup files",
      identified_at: findings.last_scanned,
      description: `Visible Backup files found`,
      category: "Visible internal files",
      location: findings.url,
      osi_layer: "APPLICATION",
      severity: "INFORMATIONAL",
      attributes: {
        joomla_backup_files: findings.joomla_backup_files
      }
    }
  }
  // Check if any core vulnerabilities exist; if yes list findings
  let parsed_vulnerabilities = []
  if (findings.vulnerabilities_count > 0) {
    parsed_vulnerabilities = findings.vulnerabilities.map((vuln) => {
      return {
        name: vuln.name,
        identified_at: findings.last_scanned,
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
  return parsed_vulnerabilities.concat(parsed_backupFiles).concat(parsed_debug_mode_enabled)
}
module.exports.parse = parse;
