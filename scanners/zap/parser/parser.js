// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const xml2js = require("xml2js");

function riskToSeverity(risk) {
  switch (parseInt(risk, 10)) {
    case 0:
      return "INFORMATIONAL";
    case 1:
      return "LOW";
    case 2:
      return "MEDIUM";
    default:
      return "HIGH";
  }
}

function stripHtmlTags(str) {
  if (!str || str === null || str === "") {
    return false;
  } else {
    str = str.toString();
  }
  return str.replace(/<[^>]*>/g, "");
}

function truncate({ text, maxLength = 2048 }) {
  if (!text || text.length < maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

/**
 * xmljs transforms xml into objects which values are always wrapped as arrays, as these could potentially have multiple children.
 * This methods transforms these objects values into single values without arrays.
 * E.g. { host: ['example.com'], port: [1234] } into { host: 'example.com', port: 1234 }
 *
 * @param {Object} rawAlert
 */
function normalizeXmlObject(rawAlert = {}) {
  for (const [key, value] of Object.entries(rawAlert)) {
    if (Array.isArray(value) && value.length > 0) {
      rawAlert[key] = value[0];
    }
  }

  return rawAlert;
}

function createFindingFromAlert(alert, { location, host, port }) {
  let findingUrls = []
  if(Array.isArray(alert.instances.instance)) {
    findingUrls = alert.instances.instance.map(normalizeXmlObject);
  }

  return {
    name: stripHtmlTags(alert.name),
    description: stripHtmlTags(alert.desc),
    hint: alert.hint,
    category: alert.alert || stripHtmlTags(alert.name),
    location,
    osi_layer: "APPLICATION",
    severity: riskToSeverity(alert.riskcode),
    attributes: {
      hostname: host,
      port,
      zap_confidence: alert.confidence || null,
      zap_count: alert.count || null,
      zap_solution: stripHtmlTags(alert.solution) || null,
      zap_otherinfo: truncate({
        text: stripHtmlTags(alert.otherinfo) || null,
        maxLength: 2048
      }),
      zap_reference: stripHtmlTags(alert.reference) || null,
      zap_cweid: alert.cweid || null,
      zap_wascid: alert.wascid || null,
      zap_riskcode: alert.riskcode || null,
      zap_pluginid: alert.pluginid || null,
      zap_finding_urls: findingUrls
    }
  };
}

async function parse(fileContent) {
  const { OWASPZAPReport } = await xml2js.parseStringPromise(fileContent);

  const findings = [];

  for (const site of OWASPZAPReport.site) {
    // Extract site information from the xml attributes
    const { name: location, host, port } = site.$;
    for (const { alertitem: alerts = [] } of site.alerts) {
      for (const rawAlert of alerts) {
        const alert = normalizeXmlObject(rawAlert);
        findings.push(createFindingFromAlert(alert, { location, host, port }));
      }
    }
  }

  return findings;
}

module.exports.parse = parse;
