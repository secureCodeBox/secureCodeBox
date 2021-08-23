// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

async function parse(fileContent) {
    let findings = JSON.parse(fileContent)
    let results = ''

    Object.keys(findings).forEach(key => {
        let domain = key;
        let domain_findings = findings[domain]
        let vulns = domain_findings.Vulnerabilities

        // Parsing Vulnerabilities
        let parsed_vulnerabilities = vulns.map((vuln) => {
            return {
                name: vuln.Type,
                description: `Vulnerability of type ${vuln.Type} found`,
                category: "Vulnerability",
                location: domain,
                osi_layer: "APPLICATION",
                severity: "HIGH",
                attributes: {
                    typo3_version: domain_findings.Version,
                    advisory: vuln.Advisory,
                    subcomponent: vuln.Subcomponent,
                    versions_affected: vuln.Affected,
                    advisory_url: vuln['Advisory URL'],

                }
            };
        });
        // Parsing Extenstions
        let extensions = domain_findings.Extensions
        let parsed_extensions = extensions.map((ext) => {

            // Check if extension has vulnerabilities : if yes severity = HIGH
            let severity = 'INFORMATIONAL'
            if (ext.Vulnerabilities.length > 0) {
                severity = 'HIGH'
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
                    version_file: ext['Version File'],
                    vulnerabilities: ext.Vulnerabilities
                }
            };
        });

        results = parsed_vulnerabilities.concat(parsed_extensions)

    });
    return results
}
module.exports.parse = parse;