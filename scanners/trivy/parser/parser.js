// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function parse(scanResults) {
  // The first scan always contains the image id a similar format to: "bkimminich/juice-shop:v10.2.0 (alpine 3.11.5)"
  const imageScanResult = scanResults;

  if (typeof(imageScanResult) === "string") // empty file
    return [];

  const imageId = imageScanResult.ArtifactName;

  // check if scanResults.Results is an array
  if (!Array.isArray(scanResults.Results)) {
    return findings;
  }

  // Use flatMap to iterate through scanResults.Results and flatten the resulting findings array
const findings = scanResults.Results.flatMap(({ Target: target, Vulnerabilities }) => {
  const vulnerabilities = Vulnerabilities || [];
  const category = getCategory(target);

  // Map each vulnerability to a finding object
  return vulnerabilities.map(vulnerability => {
    const { VulnerabilityID, References } = vulnerability;

    // Create CVE/NSWG references and their URLs if applicable
    const cve_nswg_references = VulnerabilityID.startsWith("CVE-") ? [
      { type: "CVE", value: VulnerabilityID },
      { type: "URL", value: `https://nvd.nist.gov/vuln/detail/${VulnerabilityID}` }
    ] : VulnerabilityID.startsWith("NSWG-") ? [
      { type: "NSWG", value: VulnerabilityID },
      { type: "URL", value: `https://github.com/nodejs/security-wg/tree/master/vuln` }
    ] : [];

    // Create URL references from the vulnerability references
    const url_references = References ? References.filter(ref => ref.startsWith("http")).map(ref => ({ type: "URL", value: ref })) : [];

    // Combine CVE/NSWG and URL references
    const references = [...cve_nswg_references, ...url_references];

    // Return the findings object for the current vulnerability
    return {
      name: vulnerability.Title || `Vulnerability in Dependency ${vulnerability.PkgName} (${vulnerability.InstalledVersion})`,
      description: vulnerability.Description,
      category,
      location: imageId,
      osi_layer: "NOT_APPLICABLE",
      severity: getAdjustedSeverity(vulnerability.Severity),
      mitigation: `Update the affected package ${vulnerability.PkgName} to the fixed version: ${vulnerability.FixedVersion} or remove the package from the image.`,
      references,
      attributes: {
        installedVersion: vulnerability.InstalledVersion,
        fixedVersion: vulnerability.FixedVersion,
        packageName: vulnerability.PkgName,
        vulnerabilityId: VulnerabilityID,
        references: References,
        foundIn: target,
      },
    };
  });
});

return findings;

  
}

function getCategory(target) {
    let category = "Image Vulnerability";
    if (target.endsWith("package-lock.json") || target == "Node.js") {
      category = "NPM Package Vulnerability";
    } else if (target.endsWith("Gemfile.lock")) {
      category = "Ruby Package Vulnerability";
    } else if (target.endsWith("Pipfile.lock")) {
      category = "Python Package Vulnerability";
    } else if (target.endsWith("Cargo.lock")) {
      category = "Rust Package Vulnerability";
    } else if (target.endsWith("Composer.lock")) {
      category = "PHP Package Vulnerability";
    } else if (target.endsWith("go.sum")) {
      category = "Go Package Vulnerability";
    }
    return category;
}

function getAdjustedSeverity(severity){
  return severity === "CRITICAL"
  ? "HIGH"
  : severity === "UNKNOWN"
  ? "INFORMATIONAL"
  : severity;
}

module.exports.parse = parse;
