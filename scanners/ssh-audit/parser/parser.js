// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const templates = {
  del: {
    critical: {
      kex: {
        name: "Insecure SSH KEX Algorithms",
        description: "Discouraged SSH key exchange algorithms in use",
        mitigation: "Remove these KEX algorithms",
      },
      key: {
        name: "Insecure SSH Key Algorithms",
        description: "Discouraged SSH key algorithms in use",
        mitigation: "Remove these key algorithms",
      },
      mac: {
        name: "Insecure SSH MAC Algorithms",
        description:
          "Discouraged SSH message authentication code algorithms in use",
        mitigation: "Remove these MAC algorithms",
      },
      enc: {
        name: "Insecure SSH Encryption Algorithms",
        description: "Discouraged SSH Encryption algorithms are in use",
        mitigation: "Remove these encryption algorithms",
      },
    },
    warning: {
      kex: {
        name: "Insecure SSH KEX Algorithms",
        description: "Discouraged SSH key exchange algorithms in use",
        mitigation: "Remove these KEX algorithms",
      },
      key: {
        name: "Insecure SSH Key Algorithms",
        description: "Discouraged SSH key algorithms in use",
        mitigation: "Remove these key algorithms",
      },
      mac: {
        name: "Insecure SSH MAC Algorithms",
        description:
          "Discouraged SSH message authentication code algorithms in use",
        mitigation: "Remove these MAC algorithms",
      },
      enc: {
        name: "Insecure SSH Encryption Algorithms",
        description: "Discouraged SSH Encryption algorithms are in use",
        mitigation: "Remove these encryption algorithms",
      },
    },
  },
  chg: {
    critical: {
      kex: {
        name: "SSH KEX Algorithms must be changed",
        description: "Weak SSH key exchange algorithms in use",
        mitigation: "Change these KEX algorithms",
      },
      key: {
        name: "SSH Key Algorithms must be changed",
        description: "Weak SSH key algorithms in use",
        mitigation: "Change these key algorithms",
      },
      mac: {
        name: "SSH MAC Algorithms must be changed",
        description: "Weak SSH message authentication code algorithms in use",
        mitigation: "Change these MAC algorithms",
      },
      enc: {
        name: "SSH Encryption Algorithms must be changed",
        description: "Weak SSH encryption algorithms in use",
        mitigation: "Change these encryption algorithms",
      },
    },
    warning: {
      kex: {
        name: "SSH KEX Algorithms must be changed",
        description: "Weak SSH key exchange algorithms in use",
        mitigation: "Change these KEX algorithms",
      },
      key: {
        name: "SSH Key Algorithms must be changed",
        description: "Weak SSH key algorithms in use",
        mitigation: "Change these key algorithms",
      },
      mac: {
        name: "SSH MAC Algorithms must be changed",
        description: "Weak SSH message authentication code algorithms in use",
        mitigation: "Change these MAC algorithms",
      },
      enc: {
        name: "SSH Encryption Algorithms must be changed",
        description: "Weak SSH encryption algorithms in use",
        mitigation: "Change these encryption algorithms",
      },
    },
  },
  add: {
    informational: {
      kex: {
        name: "SSH KEX Algorithms must be added",
        description: "SSH key exchange algorithms missing",
        mitigation: "Add these KEX algorithms",
      },
      key: {
        name: "SSH Key Algorithms must be added",
        description: "SSH key algorithms missing",
        mitigation: "Add these key algorithms",
      },
      mac: {
        name: "SSH MAC Algorithms must be added",
        description: "SSH message authentication code algorithms missing",
        mitigation: "Add these MAC algorithms",
      },
      enc: {
        name: "SSH Encryption Algorithms must be added",
        description: "SSH encryption algorithms missing",
        mitigation: "Add these encryption algorithms",
      },
    },
    critical: {
      kex: {
        name: "SSH KEX Algorithms must be added",
        description: "SSH key exchange algorithms missing",
        mitigation: "Add these KEX algorithms",
      },
      key: {
        name: "SSH Key Algorithms must be added",
        description: "SSH key algorithms missing",
        mitigation: "Add these key algorithms",
      },
      mac: {
        name: "SSH MAC Algorithms must be added",
        description: "SSH message authentication code algorithms missing",
        mitigation: "Add these MAC algorithms",
      },
      enc: {
        name: "SSH Encryption Algorithms must be added",
        description: "SSH encryption algorithms missing",
        mitigation: "Add these encryption algorithms",
      },
    },
    warning: {
      kex: {
        name: "SSH KEX Algorithms must be added",
        description: "SSH key exchange algorithms missing",
        mitigation: "Add these KEX algorithms",
      },
      key: {
        name: "SSH Key Algorithms must be added",
        description: "SSH key algorithms missing",
        mitigation: "Add these key algorithms",
      },
      mac: {
        name: "SSH MAC Algorithms must be added",
        description: "SSH message authentication code algorithms missing",
        mitigation: "Add these MAC algorithms",
      },
      enc: {
        name: "SSH Encryption Algorithms must be added",
        description: "SSH encryption algorithms missing",
        mitigation: "Add these encryption algorithms",
      },
    },
  },
};

/**
 * Transforms recommendations from the ssh-audit scanner into SSH Policy Violation Findings
 * @param {String} recommendationSeverityLevel
 * @param {{}} value
 */
function transformRecommendationToFinding(
  recommendationSeverityLevel,
  value,
  destination
) {
  // SSH audit has critical and warnings as recommendations.
  // These are HIGH and MEDIUM severities, respectively
  const policyViolationFindings = [];
  let severity = "LOW";
  if (recommendationSeverityLevel == "critical") severity = "HIGH";
  if (recommendationSeverityLevel == "warning") severity = "MEDIUM";
  const findingTemplate = null;
  // recommendationAction = del/chg/add
  Object.entries(value).map(([recommendationAction, algorithms]) => {
    //algorithmType = kex/ key/ mac, , algorithmNames = {name+note}
    Object.entries(algorithms).map(([algorithmType, algorithmData]) => {
      const algorithmNames = Object.entries(algorithmData).map(
        ([keyNames, content]) => Object.values(content)
      );

      const findingTemplate =
        templates[recommendationAction][recommendationSeverityLevel][
          algorithmType
        ] || null;

      if (findingTemplate != null && typeof findingTemplate != "undefined") {
        findingTemplate["severity"] = severity;
        findingTemplate["category"] = "SSH Policy Violation";
        findingTemplate["location"] = destination;
        findingTemplate["attributes"] = {};
        findingTemplate["attributes"]["algorithms"] = algorithmNames.flatMap(
          ([algName, note]) =>
            note == "" ? algName : `${algName} (Note: ${note})`
        );

        policyViolationFindings.push(findingTemplate);
      }
    });
  });

  return policyViolationFindings;
}


function isIPaddress(target) {
  if (/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/.test(target))
    return true;
  else return false;
}

/**
 *
 * Parses the raw results from the ssh-audit scanner into Findings
 */
async function parse(fileContent) {
  const host = fileContent;
  if (typeof host === "string") return [];

  const destination = host.target.split(":");
  const location = "ssh://" + destination[0];
  let ipAddress = null;
  let hostname = null;
  isIPaddress(destination[0])
    ? (ipAddress = destination[0])
    : (hostname = destination[0]);

  const recommendationsArray = Object.entries(host.recommendations);
  const policyViolationFindings = recommendationsArray.flatMap(
    ([recommendationSeverityLevel, value]) =>
      transformRecommendationToFinding(
        recommendationSeverityLevel,
        value,
        location
      )
  );

  // informational findings

  const serviceFinding = {
    name: "SSH Service",
    description: "Information about Used SSH Algorithms",
    category: "SSH Service",
    osi_layer: "APPLICATION",
    severity: "INFORMATIONAL",
    location: location,
    port: destination[1] || null,
    attributes: {
      hostname: hostname || null,
      ip_address: ipAddress || null,
      server_banner: host.banner?.raw || null,
      ssh_version: host.banner?.protocol || null,
      ssh_lib_cpe: host.banner?.software,
      key_algorithms: host.key,
      encryption_algorithms: host.enc,
      mac_algorithms: host.mac,
      compression_algorithms: host.compression,
      key_exchange_algorithms: host.kex,
      fingerprints: host.fingerprints,
    },
  };
  return [serviceFinding, ...policyViolationFindings];
}

module.exports.parse = parse;
