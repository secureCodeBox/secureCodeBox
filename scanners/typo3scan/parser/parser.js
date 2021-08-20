// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

async function parse(fileContent) {
    let findings = JSON.parse(fileContent)

    if (typeof fileContent === "string") {
        findings = fileContent
            .split("\n")
            .map((vulnJson) => JSON.parse(vulnJson));
    }
    findings = findings[0] // Trimming the begining of the JS Object
    let domain = Object.keys(findings)[0]; // Getting the first key (and the only key)

    let parsed_findings = findings[domain]

    // Parsing Vulnerabilities
    let vulns = parsed_findings.Vulnerabilities
    let parsed_vulnerabilities = vulns.map((vuln) => {
        return {
            name: vuln.Type,
            description: `Vulnerability of type ${vuln.Type} found`,
            category: "Vulnerability",
            location: domain,
            osi_layer: "APPLICATION",
            severity: "HIGH",
            attributes: {
                Typo3_Version: parsed_findings.Version,
                Advisory: vuln.Advisory,
                Subcomponent: vuln.Subcomponent,
                Versions_affected: vuln.Affected,
                Advisory_URL: vuln['Advisory URL'],

            }
        };
    });

    // Parsing Extenstions
    let extensions = parsed_findings.Extensions
    let parsed_extensions = extensions.map((ext) => {

        // Check if extension has vulnerabilities : if yes severity = HIGH
        let severity = 'INFORMATIONAL'
        if ( ext.Vulnerabilities.length > 0) {
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
                Typo3_Version: parsed_findings.Version,
                Repository: ext.Repo,
                Extension_Version: ext.Version,
                Version_File: ext['Version File'],
                Vulnerabilities: ext.Vulnerabilities
            }
        };
    });

    let results = parsed_vulnerabilities.concat(parsed_extensions)
    return results
}
module.exports.parse = parse;