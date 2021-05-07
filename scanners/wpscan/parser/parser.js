// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Convert the WPScan file / json into secureCodeBox Findings
 */
async function parse(scanResults) {

  const wpscanVersion       = scanResults.banner.version;
  const wpscanRequestsDone  = scanResults.requests_done;
  
  const targetUrl = scanResults.target_url;
  const targetIp  = scanResults.target_ip;

  const wp            = scanResults.version

  const findings = [];

  // add a general INFORMATIONAL summary finding
  findings.push({
    name: "WordPress Service",
    description: "WordPress Service Information",
    category: "WordPress Service",
    location: targetUrl,
    osi_layer: "APPLICATION",
    severity: "INFORMATIONAL",
    reference: {},
    confidence: wp.confidence,
    attributes: {
      hostname: targetUrl,
      ip_address: targetIp,
      wpscan_version: wpscanVersion,
      wpscan_requests: wpscanRequestsDone,
      wp_version: wp.number,
      wp_release_date: wp.release_date,
      wp_release_status: wp.status, 
      wp_interesting_entries: wp.interesting_entries,
      wp_found_by: wp.found_by,
      wp_confirmed_by: wp.confirmed_by,
      wp_vulnerabilities: wp.vulnerabilities
    },
  });

  // add all interesting findings as INFORMATIONAL
  for (const interestingFinding of scanResults.interesting_findings) {
    //console.log(interestingFinding);
    findings.push({
      name: "WordPress finding '"+ interestingFinding.type + "'",
      description: interestingFinding.to_s,
      category: "WordPress " + interestingFinding.type,
      location: interestingFinding.url,
      osi_layer: "APPLICATION",
      severity: "INFORMATIONAL",
      confidence: interestingFinding.confidence,
      reference: {},
      attributes: {
	hostname: targetUrl,
        wp_interesting_entries: interestingFinding.interesting_entries,
        wp_found_by: interestingFinding.found_by,
        wp_confirmed_by: interestingFinding.confirmed_by
      },
    });
  }

  return findings;
}

module.exports.parse = parse;
