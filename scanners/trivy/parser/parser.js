// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function parse(fileContent) {
  // The first scan always contains the image id a similar format to: "bkimminich/juice-shop:v10.2.0 (alpine 3.11.5)"

  let scanResults = fileContent;
  if (typeof fileContent === "string") {
    if (fileContent.includes("{") && fileContent.includes("}")) {
      scanResults = JSON.parse(fileContent)
    } else {
      // empty file
      return [];
    }
  }

  if (Object.prototype.hasOwnProperty.call(scanResults, 'ClusterName')) {
    // Results of k8s-scans always contain an attribute 'ClusterName' at first position of the JSON document.
    // These scan-results need a different parsing
    const clusterName = scanResults.ClusterName;
    return await parseK8sScanResults(clusterName, scanResults);
  } else {
    return parseImageScanResults(scanResults);
  }
}

function parseImageScanResults(imageScanResults) {
  // check if imageScanResults.Results is an array and non empty
  if (!Array.isArray(imageScanResults.Results) || imageScanResults.Results.length === 0) {
    return [];
  }

  const imageId = imageScanResults.ArtifactName;
  
  // Use flatMap to iterate through imageScanResults.Results and flatten the resulting findings array
const findings = imageScanResults.Results.flatMap(({ Target: target, Vulnerabilities }) => {
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

    const url_references = getUrlReferences(References);

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

function parseK8sScanResults(clusterName, scanResults) {
  /**
  Expected structure of trivy-k8s-scanResult:

  ClusterName: string
  Resources: array
    Namespace: string
    Kind: string
    Name: string
    Results: array
      Target: string
      Class: string
      Type: string
      MisconfSummary: object (ignored)
      Vulnerabilities or Misconfigurations: array
        ID
        <others>
  */
  return new Promise((resolve, reject) => {

    var keys = Object.keys(scanResults);
    const expectedTopLevelAttributes = ["ClusterName", "Resources"];
    const found = keys.find(key => !expectedTopLevelAttributes.includes(key));
    if (found !== undefined) {
      reject(new Error("Unexpected attribute '" + found + "' on top-level of scan-result document"));
    }

    if (!scanResults.Resources || scanResults.Resources.length === 0) {
      reject(new Error("No resources listet in scan-result document"));
    }

    const findings = scanResults.Resources.flatMap((resourceItem) => parseK8sScanResultResource(clusterName, resourceItem, reject));

    resolve(findings);
  });
}

function parseK8sScanResultResource(clusterName, resourceItem, reject) {
  let findings = [];

  const {Namespace: namespace, Kind: kind, Name: name, Results} = resourceItem;
  const results = Results || [];

  for (const aResult of results) {
    const {Target: target, Class: clazz, Type: type} = aResult;

    var keys = Object.keys(aResult);
    const expectedAttributes = ["Target", "Class", "Type", "Misconfigurations", "Vulnerabilities", "MisconfSummary"];
    const found = keys.find(key => !expectedAttributes.includes(key));
    if (found !== undefined) {
      reject(new Error("Unexpected attribute '" + found + "' on resource-item"));
    }

    let categoryName = 'Vulnerabilities';
    const vulnerabilities = aResult[categoryName] || [];
    findings = findings.concat(
      vulnerabilities.map(vulnerability =>
        convertTrivyK8sFindingToSCBFinding(vulnerability, clusterName, namespace, kind, name, target, clazz, type, categoryName)
      )
    );

    categoryName = 'Misconfigurations';
    const misconfigurations = aResult[categoryName] || [];
    findings = findings.concat(
      misconfigurations.map(misconfiguration =>
        convertTrivyK8sFindingToSCBFinding(misconfiguration, clusterName, namespace, kind, name, target, clazz, type, categoryName)
      )
    );
  }

  return findings;
}

function convertTrivyK8sFindingToSCBFinding(trivyK8sFinding, clusterName, namespace, kind, k8sName, target, clazz, type, categoryName) {
  let references = trivyK8sFinding.PrimaryURL ? [{type: "URL", value: trivyK8sFinding.PrimaryURL}] : [];

  const url_references = getUrlReferences(trivyK8sFinding.References).filter(ref => ref.value !== trivyK8sFinding.PrimaryURL);
  references = references.concat(url_references);

  const category = categoryName === 'Vulnerabilities' ? 'Vulnerability' : 'Misconfiguration';

  let name = `Finding in Dependency ${trivyK8sFinding.PkgName} (${trivyK8sFinding.InstalledVersion})`
  if (trivyK8sFinding.Title) {
    name = trivyK8sFinding.Title;
    if (trivyK8sFinding.Message) {
      name += `(${trivyK8sFinding.Message})`;
    }
  }

  let location = `Kind: '${kind}' / Name: '${k8sName}'`;
  if (namespace) {
    location = `Namespace: '${namespace}' / ${location}`;
  }
  if (clusterName) {
    location = `Cluster: '${clusterName}' / ${location}`;
  }

  let foundIn = `Target: '${target}'`
  if (clazz) {
    foundIn = `${foundIn} / Class: '${clazz}'`;
  }
  if (type) {
    foundIn = `${foundIn} / Type: '${type}'`;
  }

  const finding = {
    name,
    description: trivyK8sFinding.Description || trivyK8sFinding.Message,
    category,
    location,
    severity: getAdjustedSeverity(trivyK8sFinding.Severity),
    mitigation: trivyK8sFinding.Resolution ? trivyK8sFinding.Resolution : undefined,
    references,
    attributes: {
      installedVersion: trivyK8sFinding.InstalledVersion,
      fixedVersion: trivyK8sFinding.FixedVersion,
      packageName: trivyK8sFinding.PkgName,
      id: trivyK8sFinding.VulnerabilityID ? trivyK8sFinding.VulnerabilityID : trivyK8sFinding.ID,
      references: trivyK8sFinding.References,
      foundIn,
    },
  };
  return finding;
}

/**
 * Create URL references from the vulnerability references
 */
function getUrlReferences(References) {
  return References ? References.filter(ref => ref.startsWith("http")).map(ref => ({type: "URL", value: ref})) : [];
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
