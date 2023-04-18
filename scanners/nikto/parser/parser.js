// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const INFORMATIONAL = "INFORMATIONAL";
const LOW = "LOW";
const MEDIUM = "MEDIUM";
const HIGH = "HIGH";
/**
 * Sorts Nikto findings into Categories
 *
 * @param {string} category
 */
function categorize({ id }) {
  if (id === 999957) {
    return ["X-Frame-Options Header", LOW];
  } else if (id === 999102) {
    return ["X-XSS-Protection", LOW];
  } else if (id === 999100) {
    return ["Uncommon Header", INFORMATIONAL];
  } else if (id === 999996) {
    return ["robots.txt", INFORMATIONAL];
  } else if (id === 740001) {
    return ["Potential Backup File", INFORMATIONAL];
  } else if (id === 999103) {
    return ["X-Content-Type-Options Header", INFORMATIONAL];
  } else if (id === 521000) {
    return ["Path Traversal", HIGH];
  } else if (id >= 600000 && id < 700000) {
    return ["Outdated Software", MEDIUM];
  } else if (id >= 800000 && id < 900000) {
    return ["Identified Software", INFORMATIONAL];
  } else if (id >= 0 && id < 100000) {
    return ["Potential Vulnerability", HIGH];
  } else if (id >= 500017 && id < 600000) {
    return ["Identified Software", INFORMATIONAL];
  } else if (id >= 300000 && id < 400000) {
    return ["Embedded Device", INFORMATIONAL];
  }

  return ["Nikto Finding", INFORMATIONAL];
}

async function parse({ host, ip, port: portString, banner, vulnerabilities }) {
  const port = parseInt(portString, 10);

  if (!vulnerabilities) // empty file
    return [];

  return vulnerabilities.filter(Boolean).map(({ id, method, url, msg, references }) => {
    const niktoId = parseInt(id, 10);

    const [category, severity] = categorize({ id: niktoId });

    // We can only guess at this point. Nikto doesn't tell use anymore :(
    const protocol = port === 443 || port === 8443 ? "https" : "http";

    // Create a regular expression to extract the CWE reference number
    const regex = new RegExp("\\d*(?=\\.html)");

    const refs = references
      ? [
          {
            type: "URL",
            value: references,
          },
          // If the references string starts with a CWE URL, add a CWE reference object
          ...(references.startsWith("https://cwe.mitre.org")
            ? [
                {
                  type: "CWE",
                  value: `CWE-${references.match(regex)[0]}`,
                },
              ]
            : []),
        ]
      : null;
    

    return {
      name: msg.trimRight(),
      description: null,
      category,
      location: `${protocol}://${host}${url}`,
      osi_layer: "NETWORK",
      severity,
      attributes: {
        ip_address: ip,
        hostname: host,
        banner,
        method,
        port,
        niktoId,
        references: refs
      },
    };
  });
}

module.exports.parse = parse;
