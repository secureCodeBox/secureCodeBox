// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const xml2js = require('xml2js');

async function parse(fileContent) {
  const hosts = await parseResultFile(fileContent);
  return transformToFindings(hosts);
}

function transformToFindings(risks) {

  const riskFindings = risks.map(risk => {
    let severity = null;
    if (risk.points > 30)
      severity = 'HIGH'
    else if (risk.points <= 30 && risk.points > 10)
      severity = 'MEDIUM'
    else if (risk.points <= 10 && risk.points > 0)
      severity = 'LOW'
    else
      severity = 'INFORMATIONAL'

    return {
      name: risk.model,
      category: risk.category,
      description: risk.rationale,
      location: risk.domain,
      osi_layer: 'Application',
      severity: severity,
      attributes: {
        riskID: risk.riskID
      }
    }
  });

  return [...riskFindings];
}

/**
 * Parses a given PingCastle XML file to a smaller JSON represenation with the following object:
 * {
 *   points: rule.Points,
 *   category: rule.Category,
 *   model: rule.Model,
 *   riskID: rule.RiskId,
 *   rationale: rule.Rationale,
 *   domain: domain from healthcheck
 * }
 * @param {*} fileContent
 */
function parseResultFile(fileContent) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(fileContent, (err, xmlInput) => {
      if (err) {
        reject(new Error('Error converting XML to JSON in xml2js: ' + err));
      } else {
        let tempRiskList = [];

        const domain = xmlInput.HealthcheckData.DomainFQDN[0];

        tempRiskList = xmlInput.HealthcheckData.RiskRules[0].HealthcheckRiskRule.map(rule => {
          const newRisk = {
            points: parseInt(rule.Points[0]),
            category: rule.Category[0],
            model: rule.Model[0],
            riskID: rule.RiskId[0],
            rationale: rule.Rationale[0],
            domain: domain
          };

          return newRisk;
        });

        resolve(tempRiskList);
      }
    });
  });
}

module.exports.parse = parse;
