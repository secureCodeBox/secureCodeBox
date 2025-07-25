// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Convert the WPScan file / json into secureCodeBox Findings
 */
export async function parse(scanResults) {
  if (!scanResults) {
    return [];
  }

  const report = JSON.parse(scanResults);
  if (!report || !report.target_url) {
    return [];
  }

  const wpscanVersion = report.banner?.version;
  const wpscanRequestsDone = report.requests_done;

  const targetUrl = report.target_url;
  const targetIp = report.target_ip;
  // convert unix timestamp to ISO date string, multiply by 1000 because JS uses milliseconds
  const identified_at = new Date(report.stop_time * 1000).toISOString();

  // Add a general INFORMATIONAL summary finding
  const summaryFinding = {
    name: "WordPress Service",
    description: "WordPress Service Information",
    identified_at: identified_at,
    category: "WordPress Service",
    location: targetUrl,
    osi_layer: "APPLICATION",
    severity: "INFORMATIONAL",
    references: null,
    confidence: report.version?.confidence,
    attributes: {
      hostname: targetUrl,
      ip_addresses: [targetIp],
      wpscan_version: wpscanVersion,
      wpscan_requests: wpscanRequestsDone,
      wp_version: report.version?.number,
      wp_release_date: report.version?.release_date,
      wp_release_status: report.version?.status,
      wp_interesting_entries: report.version?.interesting_entries,
      wp_found_by: report.version?.found_by,
      wp_confirmed_by: report.version?.confirmed_by,
      wp_vulnerabilities: report.version?.vulnerabilities,
    },
  };

  // Add all interesting findings as INFORMATIONAL
  const interestingFindings = report.interesting_findings.map(
    (interestingFinding) => {
      // Create a flattened array of references with their types
      const references = Object.entries(interestingFinding.references).flatMap(
        ([key, elements]) =>
          elements.map((element) => ({
            type: key.toUpperCase(),
            value: element,
          })),
      );

      // Return the interesting findings object for the current entry
      return {
        name: `WordPress finding '${interestingFinding.type}'`,
        description: interestingFinding.to_s,
        category: `WordPress ${interestingFinding.type}`,
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
      };
    },
  );

  // Add plugin vulnerabilities as HIGH
  const pluginVulnerabilities = Object.values(report.plugins).flatMap(
    (plugin) =>
      plugin.vulnerabilities.map((vulnerability) => {
        // Create a flattened array of references with their types
        const references = Object.entries(vulnerability.references).flatMap(
          ([key, elements]) =>
            elements.map((element) => ({
              type: key.toUpperCase(),
              value: element,
            })),
        );
        // Return the plugin vulnerabilities object for the current plugin and vulnerability
        return {
          name: `WordPress finding: vulnerability in '${plugin["slug"]}'`,
          description: vulnerability["title"],
          category: "WordPress Plugin",
          location: plugin["location"],
          osi_layer: "APPLICATION",
          severity: "HIGH",
          references: references.length > 0 ? references : null,
          attributes: {
            hostname: targetUrl,
            confidence: plugin["confidence"],
            wp_interesting_entries: plugin["interesting_entries"],
            wp_found_by: plugin["found_by"],
            wp_confirmed_by: plugin["confirmed_by"],
          },
        };
      }),
  );

  // Combine all findings and return
  return [summaryFinding, ...interestingFindings, ...pluginVulnerabilities];
}
