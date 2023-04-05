// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Convert the WPScan file / json into secureCodeBox Findings
 */
async function parse(scanResults) {
  if (typeof (scanResults) === "string") // empty file
    return [];

  const wpscanVersion = scanResults.banner.version;
  const wpscanRequestsDone = scanResults.requests_done;

  const targetUrl = scanResults.target_url;
  const targetIp = scanResults.target_ip;
  // convert unix timestamp to ISO date string, multiply by 1000 because JS uses milliseconds
  const identified_at = new Date(scanResults.stop_time * 1000).toISOString();

  const findings = [];

  // add a general INFORMATIONAL summary finding
  findings.push({
    name: "WordPress Service",
    description: "WordPress Service Information",
    identified_at: identified_at,
    category: "WordPress Service",
    location: targetUrl,
    osi_layer: "APPLICATION",
    severity: "INFORMATIONAL",
    references: null,
    confidence: scanResults.version?.confidence,
    attributes: {
      hostname: targetUrl,
      ip_address: targetIp,
      wpscan_version: wpscanVersion,
      wpscan_requests: wpscanRequestsDone,
      wp_version: scanResults.version?.number,
      wp_release_date: scanResults.version?.release_date,
      wp_release_status: scanResults.version?.status,
      wp_interesting_entries: scanResults.version?.interesting_entries,
      wp_found_by: scanResults.version?.found_by,
      wp_confirmed_by: scanResults.version?.confirmed_by,
      wp_vulnerabilities: scanResults.version?.vulnerabilities,
    },
  });

  // add all interesting findings as INFORMATIONAL
  for (const interestingFinding of scanResults.interesting_findings) {
    let references = [];
    if (Object.keys(interestingFinding.references).length > 0) {
      for (const key in interestingFinding.references) {
        for (const element of interestingFinding.references[key]) {
          references.push({
            "type": key.toUpperCase(),
            "value": element
          });
        }
      }
    }
    findings.push({
      name: "WordPress finding '" + interestingFinding.type + "'",
      description: interestingFinding.to_s,
      category: "WordPress " + interestingFinding.type,
      location: interestingFinding.url,
      osi_layer: "APPLICATION",
      severity: "INFORMATIONAL",
      confidence: interestingFinding.confidence,
      references: references.length > 0 ? references : null,
      attributes: {
        hostname: targetUrl,
        wp_interesting_entries: interestingFinding.interesting_entries,
        wp_found_by: interestingFinding.found_by,
        wp_confirmed_by: interestingFinding.confirmed_by,
      },
    });
  }

  // add plugin vulnerabilities as HIGH
  Object.values(scanResults.plugins).forEach(plugin => {
    plugin.vulnerabilities.forEach(vulnerability => {
      let references = [];
      // check if references are available
      if (Object.keys(vulnerability.references).length > 0){
        for (const key in vulnerability.references) {
          for (const element of vulnerability.references[key]) {
            references.push({
              "type": key.toUpperCase(),
              "value": element
            });
          }
        }
      }
      findings.push({
        name: "WordPress finding: vulnerability in '" + plugin['slug'] + "'",
        description: vulnerability['title'],
        category: "WordPress Plugin",
        location: plugin['location'],
        osi_layer: "APPLICATION",
        severity: "HIGH",
        references: references.length > 0 ? references : null,
        attributes: {
          hostname: targetUrl,
          confidence: plugin['confidence'],
          wp_interesting_entries: plugin['interesting_entries'],
          wp_found_by: plugin['found_by'],
          wp_confirmed_by: plugin['confirmed_by'],
        },
      });
    })
  });

  return findings;
}

module.exports.parse = parse;
