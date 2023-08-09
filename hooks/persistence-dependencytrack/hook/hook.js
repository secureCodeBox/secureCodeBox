// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const apiKey = process.env["DEPENDENCYTRACK_APIKEY"]
const baseUrl = process.env["DEPENDENCYTRACK_URL"];
const url = baseUrl.replace(/\/$/, "") + "/api/v1/bom"

async function handle({ getRawResults, scan }) {
  if (scan.status.rawResultType !== "sbom-cyclonedx") {
    // Not an SBOM scan, cannot be handled by Dependency-Track, ignore
    console.log(`Scan ${scan.metadata.name} is not an SBOM scan, ignoring.`);
    return;
  }

  const result = await getRawResults();
  if (result.bomFormat !== "CycloneDX") {
    // Not a CycloneDX SBOM, cannot be handled by Dependency-Track, ignore
    console.log("Only CycloneDX SBOMs can be sent to DependencyTrack, ignoring.");
    return;
  }

  console.log(`Persisting SBOM for ${result.metadata.component.name} to Dependency-Track`);

  // Get the project name and version from the name attribute of the main component
  // This might be a bit brittle, but there is not really a better way to get this information
  // Neither Trivy's nor Syft's SBOM contains a useful version attribute (none or sha256)
  const components = result.metadata.component.name.split(':');
  const name = components[0];
  const version = components.length > 1 ? components.pop() : "latest";

  // The POST endpoint expects multipart/form-data
  // Alternatively the PUT endpoint could be used, which requires base64-encoding the SBOM
  const formData = new FormData();
  // Automatically create new projects for uploaded SBOMs,
  // this requires either the PORTFOLIO_MANAGEMENT or PROJECT_CREATION_UPLOAD permission
  formData.append("autoCreate", "true");
  formData.append("projectName", name);
  formData.append("projectVersion", version);
  formData.append("bom", JSON.stringify(result));

  console.log(`Uploading SBOM for name: ${name} version: ${version} to ${url}`);

  // Send request to API endpoint
  const response = await fetch(url, {
    method: "POST",
    cache: "no-cache",
    headers: {
      "X-API-Key": apiKey,
    },
    body: formData,
  });

  // Response-token can be used to determine if any task is being performed on the BOM
  // Endpoint: <url>/api/v1/bom/<token>
  const content = await response.json();
  console.log(`Successfully uploaded SBOM to Dependency-Track. Response-token to check the status: ${content.token}`);
}

module.exports.handle = handle;
