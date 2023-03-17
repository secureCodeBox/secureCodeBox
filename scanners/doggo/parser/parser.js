// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function parse(fileContent) {
  const targets = parseResultFile(fileContent);

  if (process.env["DEBUG"] === "true") {
    console.log("Parsing Result File");
    console.log(targets);
  }

  const result = transformToFindings(targets);

  if (process.env["DEBUG"] === "true") {
    console.log("Transform To Findings");
    console.log(result);
  }

  return result;
}

function transformToFindings(targets) {
  // Code to transform the scanner results to scb findings
  return targets.map((target) => {
    return {
      name: `DNS Zone: ${target.name} | Type: ${target.type}`,
      description: `DNS record type ${target.type} found for zone ${target.name} with address "${target.address}".`,
      category: "DNS Information",
      location: target.name.slice(0, target.name.length - 1),
      osi_layer: "NETWORK",
      severity: "INFORMATIONAL",
      attributes: {
        doggy_dns_type: target.type,
        doggy_dns_address: target.address,
        doggy_dns_status: target.status,
        doggy_dns_rtt: target.rtt,
        doggy_dns_nameserver: target.nameserver,
      },
    };
  });
}

/**
 * Parses a given doggo result file and extracts all targets
 * @param {*} fileContent
 */
function parseResultFile(fileContent) {
  return fileContent
    .filter((rawTarget) => {
      // filter out empty targets (domain names which could not be resolved at all)
      return (
        Object.keys(rawTarget).length > 0 &&
        rawTarget.answers !== null &&
        rawTarget.answers !== undefined &&
        rawTarget.answers.length > 0
      );
    })
    .flatMap((rawTarget) => rawTarget.answers) // flatten the answers into one big array
    .filter((rawAnswers) => {
      // filter out empty answers (records which did not exists for individual domains)
      return (
        Object.keys(rawAnswers).length > 0 &&
        rawAnswers.name !== null &&
        rawAnswers.name !== undefined
      );
    });
}

module.exports.parse = parse;
