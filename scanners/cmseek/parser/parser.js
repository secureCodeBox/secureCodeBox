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
      description: `Debug mode is enabled on the site`,
      category: "Security Misconfiguration",
      osi_layer: "APPLICATION",
      severity: "MEDIUM",
    }

    parsed_debug_mode_enabled = addHostnameOrIpToFindingObject(parsed_debug_mode_enabled, findings.url);
  }

  // Check if backup files are open; if yes add finding
  let parsed_backupFiles = []
  if ("joomla_backup_files" in findings) {
    parsed_backupFiles = {
      name: "Backup files",
      description: `Visible Backup files found`,
      category: "Visible internal files",
      osi_layer: "APPLICATION",
      severity: "INFORMATIONAL",
      attributes: {
        joomla_backup_files: findings.joomla_backup_files
      }
    }

    parsed_backupFiles = addHostnameOrIpToFindingObject(parsed_backupFiles, findings.url);
  }
  // Check if any core vulnerabilities exist; if yes list findings
  let parsed_vulnerabilities = []
  if (findings.vulnerabilities_count > 0) {
    parsed_vulnerabilities = findings.vulnerabilities.map((vuln) => {
      parsed_vulnerabilities = {
        name: vuln.name,
        description: `Vulnerability of type ${vuln.name} found`,
        category: "Vulnerability",
        osi_layer: "APPLICATION",
        severity: "HIGH",
        attributes: {
          joomla_version: findings.joomla_version,
          references: vuln.references,
        }
      };

      return addHostnameOrIpToFindingObject(parsed_vulnerabilities, findings.url);
    });
  }
  // concat all parsed results
  return parsed_vulnerabilities.concat(parsed_backupFiles).concat(parsed_debug_mode_enabled)
}

// findings.url can also be an IP depending on the parameters of the scan
function addHostnameOrIpToFindingObject(finding, unidentifiedString) {
  // this function assumes that unidentifiedString is either an ip or an url/hostname 
  // checking if a string is a valid url is pretty complicated, so it is only checked if the string is an ip.

  // first capture group is a potential protocol, the second capture group is the ip/hostname, the third capture group is a potential port
  // example: (ssh://)(1.1.1.1)(:20) or (http://)(google.de)(:80) or just 1.1.1.1 or just google.de
  let regex = /([a-zA-Z]+:\/\/*)?([^\/:]*)(:\d+)?/;
  let strippedString = regex.exec(unidentifiedString)[2];

  let isIp = require('net').isIP(strippedString);
  if (isIp) {
    finding.ip_address = strippedString;
  }
  else {
    finding.hostname = strippedString;
  }
  return finding;
}

module.exports.parse = parse;
