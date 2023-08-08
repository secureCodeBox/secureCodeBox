// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function parse(_fileContent, scan) {
  const imageId = scan.spec.parameters[0];
  const downloadLink = scan.status.rawResultDownloadLink;

  // TODO parse vulnerabilities section if it exists

  return [
    {
      name: `SBOM for ${imageId}`,
      description: `Generated an SBOM for: '${imageId}'`,
      category: "SBOM",
      osi_layer: "APPLICATION",
      severity: "INFORMATIONAL",
      attributes: {
        downloadLink,
      },
    },
  ];
}

module.exports.parse = parse;
