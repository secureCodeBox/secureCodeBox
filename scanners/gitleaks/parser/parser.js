// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const HIGH_TAGS = ["HIGH"];
const MEDIUM_TAGS = ["MEDIUM"];

async function parse (fileContent, scan) {

  if (fileContent) {
    return fileContent.map(finding => {
  
      let severity = 'LOW';
  
      if (containsTag(finding.Tags, HIGH_TAGS)) {
        severity = 'HIGH'
      } else if (containsTag(finding.Tags, MEDIUM_TAGS)) {
        severity = 'MEDIUM'
      }
  
      return {
        name: finding.RuleID,
        description: 'The name of the rule which triggered the finding: ' + finding.RuleID,
        osi_layer: 'APPLICATION',
        severity: severity,
        category: 'Potential Secret',
        attributes: {
          commit: finding.Commit,
          description: finding.Description,
          offender: finding.Secret,
          author: finding.Author,
          email: finding.Email,
          date: finding.Date,
          file: finding.File,
          line_number: finding.StartLine,
          tags: finding.Tags,
          line: finding.Match
        }
      }
    });
  }
  else
  {
    return [];
  }
}

function containsTag (tag, tags) {
  let result = tags.filter(longTag => tag.includes(longTag));
  return result.length > 0;
}

module.exports.parse = parse;
