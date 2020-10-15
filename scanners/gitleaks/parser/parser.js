const HIGH_TAGS = ['JWT', 'Artifactory', 'AWS', 'PrivateKey'];
const MEDIUM_TAGS = ['Hash', 'Facebook', 'Twitter', 'Github', 'LinkedIn', 'Slack', 'Google', 'Heroku',
  'Mailchimp', 'Mailgun', 'Paypal', 'Picatic', 'Teams', 'Jenkins', 'Stripe', 'Square', 'Twilio'];
const LOW_TAGS = ['Generic', 'FileName', 'FileExtension'];

async function parse (fileContent) {

  return fileContent.map(finding => {

    let severity = 'LOW';

    if (containsTag(finding.tags, HIGH_TAGS)) {
      severity = 'HIGH'
    } else if (containsTag(finding.tags, MEDIUM_TAGS)) {
      severity = 'MEDIUM'
    }

    return {
      name: finding.rule,
      description: 'The name of the rule which triggered the finding: ' + finding.rule,
      osi_layer: 'APPLICATION',
      severity: severity,
      category: 'potential secret',
      attributes: {
        commit: finding.commit,
        repo: finding.repo,
        offender: finding.offender,
        author: finding.author,
        email: finding.email,
        date: finding.date,
        file: finding.file,
        line_number: finding.lineNumber,
        tags: finding.tags.split(',').map(tag => tag.trim()),
        line: finding.line
      }
    }
  });
}

function containsTag (tag, tags) {
  let result = tags.filter(longTag => tag.includes(longTag));
  return result.length > 0;
}

module.exports.parse = parse;
