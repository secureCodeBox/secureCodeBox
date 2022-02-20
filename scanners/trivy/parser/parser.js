// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function parse(scanResults) {
  // The first scan always contains the image id a similar format to: "bkimminich/juice-shop:v10.2.0 (alpine 3.11.5)"
  const imageScanResult = scanResults;

  if (typeof(imageScanResult) === "string") // empty file
    return [];

  const imageId = imageScanResult.ArtifactName;

  const findings = [];

  for (const { Target: target, Vulnerabilities } of scanResults.Results) {
    const vulnerabilities = Vulnerabilities || [];
    const category = getCategory(target);

    for (const vulnerability of vulnerabilities) {
      let reference = null;

      if (vulnerability.VulnerabilityID.startsWith("CVE-")) {
        reference = {
          id: vulnerability.VulnerabilityID,
          source: `https://nvd.nist.gov/vuln/detail/${vulnerability.VulnerabilityID}`,
        };
      } else if (vulnerability.VulnerabilityID.startsWith("NSWG-")) {
        reference = {
          id: vulnerability.VulnerabilityID,
          source: `https://github.com/nodejs/security-wg/tree/master/vuln`,
        };
      }

      findings.push({
        name: vulnerability.Title || `Vulnerability in Dependency ${vulnerability.PkgName} (${vulnerability.InstalledVersion})`,
        description: vulnerability.Description,
        category,
        location: imageId,
        osi_layer: "NOT_APPLICABLE",
        severity: getAdjustedSeverity(vulnerability.Severity),
        reference,
        attributes: {
          installedVersion: vulnerability.InstalledVersion,
          fixedVersion: vulnerability.FixedVersion,
          packageName: vulnerability.PkgName,
          vulnerabilityId: vulnerability.VulnerabilityID,
          references: vulnerability.References,
          foundIn: target,
        },
      });
    }
  }
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
