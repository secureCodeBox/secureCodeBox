const templates = {
    del: {
        kex:{
            findingTemplate: {
                description: "Good / encouraged SSH compression algorithms are missing",
                name: "Missing SSH compression algorithms"
              }
        }
    },
    chg:{
        kex:{
            findingTemplate: {
                description: "Change Keks",
                name: "Change Keks"
              }
        }
    }
}


/**
 * Transforms a recommendation string from thessh-audit Tools into a SSH Policy Violation Findings
 * 
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

async function parse({ target, banner, enc, kex, key, mac, compression, fingerprints }) {
    const identified_at = new Date().toISOString();
    const serviceFinding = {
        name: "SSH Service",
        description: "SSH Service Information",
        identified_at: identified_at,
        category: "SSH Service",
        osi_layer: "APPLICATION",
        severity: "INFORMATIONAL",
        reference: {},
        mitigation: null,
        location: target,
        attributes: {
            hostname: target || null,
            ip_address: "todo",
            server_banner: banner?.raw || null,
            ssh_version: banner?.protocol[0] || null,
            os_cpe: "todo",
            ssh_lib_cpe: banner?.software,
            key_algorithms: key,
            encryption_algorithms: enc,
            mac_algorithms: mac,
            compression_algorithms: compression,
            key_exchange_algorithms: kex,
            fingerprints: fingerprints //ask
        }
    };
    return [serviceFinding];
}

module.exports.parse = parse;