// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const policyViolationFindingRules = [{
    policyViolationPrefix: /^Add these key exchange algorithms/,
    findingTemplate: {
      description: "Good / encouraged SSH key algorithms are missing",
      name: "Missing SSH Key Algorithms"
    }
  },
  {
    policyViolationPrefix: /^Add these MAC algorithms/,
    findingTemplate: {
      description: "Good / encouraged SSH MAC algorithms are missing",
      name: "Missing SSH MAC Algorithms"
    }
  },
  {
    policyViolationPrefix: /^Add these encryption ciphers/,
    findingTemplate: {
      description: "Good / encouraged SSH encryption ciphers are missing",
      name: "Missing SSH encryption Ciphers"
    }
  },
  {
    policyViolationPrefix: /^Add these compression algorithms/,
    findingTemplate: {
      description: "Good / encouraged SSH compression algorithms are missing",
      name: "Missing SSH compression algorithms"
    }
  },
  {
    policyViolationPrefix: /^Add these authentication methods/,
    findingTemplate: {
      description: "Good / encouraged SSH authentication methods are missing",
      name: "Missing SSH authentication methods"
    }
  },
  {
    policyViolationPrefix: /^Remove these key exchange algorithms/,
    findingTemplate: {
      description: "Deprecated / discouraged SSH key algorithms are used",
      name: "Insecure SSH Key Algorithms"
    }
  },
  {
    policyViolationPrefix: /^Remove these MAC algorithms/,
    findingTemplate: {
      description: "Deprecated / discouraged SSH MAC algorithms are used",
      name: "Insecure SSH MAC Algorithms"
    }
  },
  {
    policyViolationPrefix: /^Remove these encryption ciphers/,
    findingTemplate: {
      description: "Deprecated / discouraged SSH encryption ciphers are used",
      name: "Insecure SSH encryption Ciphers"
    }
  },
  {
    policyViolationPrefix: /^Remove these compression algorithms/,
    findingTemplate: {
      description: "Deprecated / discouraged SSH compression algorithms are used",
      name: "Insecure SSH compression algorithms"
    }
  },
  {
    policyViolationPrefix: /^Remove these authentication methods/,
    findingTemplate: {
      description: "Discouraged SSH authentication methods are used",
      name: "Discouraged SSH authentication methods"
    }
  },
  {
    policyViolationPrefix: /^Update your ssh version to/,
    findingTemplate: {
      description: "Outdated SSH protocol version used",
      name: "Outdated SSH Protocol Version"
    }
  }
];

/**
 * Creating the actual secureCodeBox Finding from the template from the policyViolationFindingRule and the SSH_Scan recomendation string
 */
function createPolicyViolationFinding({
  name,
  description,
  recommendation,
  host: {
    hostname,
    ipAddress
  }
}) {
  const payload = recommendation.split(": ")[1].split(", ");

  return {
    name,
    description,
    category: "SSH Policy Violation",
    osi_layer: "NETWORK",
    severity: "MEDIUM",
    reference: {},
    mitigation: recommendation,
    location: hostname || ipAddress,
    attributes: {
      hostname: hostname,
      ip_addresses: [ipAddress],
      payload: payload
    }
  };
}

/**
 * Transforms a recommendation string from the Mozilla SSH_Scan Tools into a SSH Policy Violation Findings
 * 
 * @param {string} recommendation
 */
function transformRecommendationToFinding(
  recommendation, {
    hostname,
    ipAddress
  },
  identified_at
) {
  for (const rule of policyViolationFindingRules) {
    if (rule.policyViolationPrefix.test(recommendation)) {
      return createPolicyViolationFinding({
        name: rule.findingTemplate.name,
        description: rule.findingTemplate.description,
        identified_at: identified_at,
        recommendation,
        host: {
          hostname,
          ipAddress
        }
      });
    }
  }
}

/**
 * Convert the SSH_Scan file / json into secureCodeBox Findings
 */
async function parse(fileContent) {
  const hosts = fileContent;

  if (typeof (hosts) === "string") // empty file
    return [];

  return hosts
    .flatMap(host => {
      if (host.error) {
        return undefined;
      }

      const hostname = host.hostname || null;
      const ipAddress = host.ip;

      const identified_at = new Date(host.end_time).toISOString();

      const recommendations = host.compliance.recommendations || [];
      const policyViolationFindings = recommendations.map(recommendation =>
        transformRecommendationToFinding(recommendation, {
          hostname,
          ipAddress,
          identified_at
        })
      );

      const location = hostname || ipAddress;
      const compliance = host.compliance;

      const serviceFinding = {
        name: "SSH Service",
        description: "SSH Service Information",
        identified_at: identified_at,
        category: "SSH Service",
        osi_layer: "APPLICATION",
        severity: "INFORMATIONAL",
        reference: {},
        mitigation: null,
        location: location,
        attributes: {
          hostname: host.hostname || null,
          ip_addresses: [host.ip],
          server_banner: host.server_banner || null,
          ssh_version: host.ssh_version || null,
          os_cpe: host.os_cpe,
          ssh_lib_cpe: host.ssh_lib_cpe,
          compliance_policy: compliance && compliance.policy,
          compliant: compliance && compliance.compliant,
          grade: compliance && compliance.grade,
          references: compliance && compliance.references,
          auth_methods: host.auth_methods,
          key_algorithms: host.key_algorithms,
          encryption_algorithms: host.encryption_algorithms_server_to_client,
          mac_algorithms: host.mac_algorithms_server_to_client,
          compression_algorithms: host.compression_algorithms_server_to_client
        }
      };

      return [serviceFinding, ...policyViolationFindings];
    })
    .filter(Boolean);
}

module.exports.parse = parse;
