// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const arg = require("arg");

const HIGH_TAGS = ['JWT', 'Artifactory', 'AWS', 'PrivateKey'];
const MEDIUM_TAGS = ['Hash', 'Facebook', 'Twitter', 'Github', 'LinkedIn', 'Slack', 'Google', 'Heroku',
  'Mailchimp', 'Mailgun', 'Paypal', 'Picatic', 'Teams', 'Jenkins', 'Stripe', 'Square', 'Twilio'];

async function parse (fileContent, scan) {

  const commitUrl = prepareCommitUrl(scan)

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
          commit: commitUrl + finding.Commit,
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

// FIXME: Update this function to use init container data
function prepareCommitUrl (scan) {
  if (!scan) {
    return '';
  }

  const args = arg(
    {
      '-r': String,
      '--repo': '-r'
    },
    { permissive: true, argv: scan.spec.parameters }
  );

  const repositoryUrl = args['-r'];

  if (!repositoryUrl) {
    return '';
  }

  return repositoryUrl.endsWith('/') ?
    repositoryUrl + 'commit/'
    : repositoryUrl + '/commit/'
}

function containsTag (tag, tags) {
  let result = tags.filter(longTag => tag.includes(longTag));
  return result.length > 0;
}

module.exports.parse = parse;
