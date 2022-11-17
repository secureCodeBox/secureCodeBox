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
  const targetFindings = targets.map(target => {
    let finding = {
      name: `DNS Zone: ${target.name} | Type: ${target.type}`,
      description: `DNS record type ${target.type} found for zone ${target.name} with address "${target.address}".`,
      category: "DNS Information",
      location: target.name.slice(0, target.name.length - 1),
      osi_layer: 'NETWORK',
      severity: 'INFORMATIONAL',
      attributes: {
        doggy_dns_type: target.type,
        doggy_dns_address: target.address,
        doggy_dns_status: target.status,
        doggy_dns_rtt: target.rtt,
        doggy_dns_nameserver: target.nameserver
      }
    };
    return finding;
  });

  return [...targetFindings];
}

/**
 * Parses a given doggo result file and extracts all targets
 * @param {*} fileContent
 */
function parseResultFile(fileContent) {
  let targetList = [];

  for(const rawTarget of fileContent) {
    // Code to transform raw target findings to usable js format
    if (Object.keys(rawTarget).length > 0 && rawTarget.answers !== null && rawTarget.answers !== undefined && rawTarget.answers.length > 0) { //Check for empty target
      for(const rawAnswers of rawTarget.answers) {
        if (Object.keys(rawAnswers).length > 0 && rawAnswers.name !== null && rawAnswers.name !== undefined) { //Check for empty answers
          targetList.push(rawAnswers);
        }
      }
    }

  }
  return targetList;
}

module.exports.parse = parse;
