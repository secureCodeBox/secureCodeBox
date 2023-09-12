// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function handle({
  getRawResults,
  scan,
  apiKey = process.env["DEPENDENCYTRACK_APIKEY"],
  baseUrl = process.env["DEPENDENCYTRACK_URL"],
  fetch = global.fetch
}) {
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

  // Get the components of a docker image reference, the regex is a direct JavaScript adaption of
  // the official Go-implementation available at https://github.com/distribution/reference/blob/main/regexp.go
  // but taken from pull request https://github.com/distribution/distribution/pull/3803 which
  // introduces the named groups and fixes the issue that in "bkimminich/juice-shop" the regex
  // detects "bkimminich" as part of the domain/host.
  const imageRegex = new RegExp([
    '^(?<name>(?:(?<domain>(?:localhost|(?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])',
    '(?:\\.(?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]))+|',
    '(?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])',
    '(?:\\.(?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]))*',
    '(?::[0-9]+)|\\[(?:[a-fA-F0-9:]+)\\](?::[0-9]+)?)(?::[0-9]+)?)\\/)?',
    '(?<repository>[a-z0-9]+(?:(?:[._]|__|[-]+)[a-z0-9]+)*',
    '(?:\\/[a-z0-9]+(?:(?:[._]|__|[-]+)[a-z0-9]+)*)*))',
    '(?::(?<tag>[\\w][\\w.-]{0,127}))?',
    '(?:@(?<digest>[A-Za-z][A-Za-z0-9]*(?:[-_+.][A-Za-z][A-Za-z0-9]*)*[:][0-9A-Fa-f]{32,}))?$',
  ].join(''));
  const groups = imageRegex.exec(result.metadata.component.name).groups
  const name = groups.name
  const version = groups.tag || groups.digest || "latest"

  // The POST endpoint expects multipart/form-data
  // Alternatively the PUT endpoint could be used, which requires base64-encoding the SBOM
  const formData = new FormData();
  // Automatically create new projects for uploaded SBOMs,
  // this requires either the PORTFOLIO_MANAGEMENT or PROJECT_CREATION_UPLOAD permission
  formData.append("autoCreate", "true");
  formData.append("projectName", name);
  formData.append("projectVersion", version);
  formData.append("bom", JSON.stringify(result));

  const url = baseUrl.replace(/\/$/, "") + "/api/v1/bom"
  console.log(`Uploading SBOM for name: ${name} version: ${version} to ${url}`);

  // Send request to API endpoint
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "X-API-Key": apiKey,
      },
      body: formData,
    });
  } catch (error) {
    console.error("Error sending request to Dependency-Track");
    throw error
  }

  if (!response.ok) {
    switch (response.status) {
      case 401:
        console.error(`Request failed with status ${response.status}, please check your API key`)
        break;
      case 403:
        console.error(`Request failed with status ${response.status}, make sure you gave the team/API key either the PORTFOLIO_MANAGEMENT or PROJECT_CREATION_UPLOAD permission`)
        break;
    }
    throw new Error(`Request to Dependency-Track was unsuccessful, status ${response.status}`)
  }

  // Response-token can be used to determine if any task is being performed on the BOM
  // Endpoint: <url>/api/v1/bom/<token>
  const content = await response.json();
  console.log(`Successfully uploaded SBOM to Dependency-Track. Response-token to check the status: ${content.token}`);
}

module.exports.handle = handle;
