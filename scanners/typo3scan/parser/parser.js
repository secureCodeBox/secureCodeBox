// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function parse(findings) {
    let results = []

    Object.keys(findings).forEach(key => {
        const domain = key;
        const domain_findings = findings[domain]
        const vulns = domain_findings.Vulnerabilities

        if(!vulns) // empty file
          return [];
        // Parsing Vulnerabilities
        const parsed_vulnerabilities = vulns.map((vuln) => {
            let result = {
                name: vuln.Type,
                description: `Vulnerability of type ${vuln.Type} found`,
                category: "Vulnerability",
                osi_layer: "APPLICATION",
                severity: "HIGH",
                attributes: {
                    location: domain,
                    typo3_version: domain_findings.Version,
                    advisory: vuln.Advisory,
                    subcomponent: vuln.Subcomponent,
                    versions_affected: vuln.Affected,
                    advisory_url: vuln['Advisory URL'],

                }
            };
            return addHostnameOrIpToFindingObject(result, domain);
        });
        // Parsing Extenstions
        const extensions = domain_findings.Extensions
        const parsed_extensions = extensions.map((ext) => {

            // Check if extension has vulnerabilities : if yes severity = HIGH
            let severity = 'INFORMATIONAL'
            if (ext.Vulnerabilities.length > 0) {
                severity = 'HIGH'
            }
            let result = {
                name: ext.Name,
                description: `Extension ${ext.Name} (${ext.Title}) found`,
                category: "Extension",
                osi_layer: "APPLICATION",
                severity: severity,
                attributes: {
                    location: ext.Url,
                    typo3_version: domain_findings.Version,
                    repository: ext.Repo,
                    extension_Version: ext.Version,
                    version_file: ext['Version File'],
                    vulnerabilities: ext.Vulnerabilities
                }
            };
            return addHostnameOrIpToFindingObject(result, ext.Url);
        });

        results = parsed_vulnerabilities.concat(parsed_extensions)

    });
    return results
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
