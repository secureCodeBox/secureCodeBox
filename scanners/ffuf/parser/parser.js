// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

async function parse(fileContent) {
  const targets = parseResultFile(fileContent);
  return transformToFindings(targets);
}

function transformToFindings(targets) {

  const targetFindings = [];

  // Code to transform the scanner results to scb findings

  return [...targetFindings];
}

/**
 * Parses a given ffuf result file and extracts all targets
 * @param {*} fileContent
 */
function parseResultFile(fileContent) {
  let targetList = [];

  for(const rawTarget of fileContent) {
    // Code to transform raw target findings to usable js format
    // If scanner is only able to output xml files, you have to transform them first (look at nmap parser for example)
  }
  return targetList;
}

module.exports.parse = parse;
