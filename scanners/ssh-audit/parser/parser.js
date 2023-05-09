// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const templates = {
    delCritical: {
        kex: {
            name: "Insecure SSH KEX Algorithms",
            description: "Discouraged SSH key exchange algorithms in use",
            hint: "Remove these KEX algorithms"
        },
        key: {
            name: "Insecure SSH Key Algorithms",
            description: "Discouraged SSH key algorithms in use",
            hint: "Remove these key algorithms"
        },
        mac: {
            name: "Insecure SSH MAC Algorithms",
            description: "Discouraged SSH message authentication code algorithms in use",
            hint: "Remove these MAC algorithms"
        },
        enc: {
            name: "Insecure SSH Encryption Algorithms",
            description: "Discouraged SSH Encryption algorithms are in use",
            hint: "Remove these encryption algorithms"
        }
    },
    delWarning: {
        kex: {
            name: "Insecure SSH KEX Algorithms",
            description: "Discouraged SSH key exchange algorithms in use",
            hint: "Remove these KEX algorithms"
        },
        key: {
            name: "Insecure SSH Key Algorithms",
            description: "Discouraged SSH key algorithms in use",
            hint: "Remove these key algorithms"
        },
        mac: {
            name: "Insecure SSH MAC Algorithms",
            description: "Discouraged SSH message authentication code algorithms in use",
            hint: "Remove these MAC algorithms"
        },
        enc: {
            name: "Insecure SSH Encryption Algorithms",
            description: "Discouraged SSH Encryption algorithms are in use",
            hint: "Remove these encryption algorithms"
        }
    },
    chgCritical: {
        kex: {
            name: "SSH KEX Algorithms must be changed",
            description: "Weak SSH key exchange algorithms in use",
            hint: "Change these KEX algorithms"
        },
        key: {
            name: "SSH Key Algorithms must be changed",
            description: "Weak SSH key algorithms in use",
            hint: "Change these key algorithms"
        },
        mac: {
            name: "SSH MAC Algorithms must be changed",
            description: "Weak SSH message authentication code algorithms in use",
            hint: "Change these MAC algorithms"
        },
        enc: {
            name: "SSH Encryption Algorithms must be changed",
            description: "Weak SSH encryption algorithms in use",
            hint: "Change these encryption algorithms"
        }
    },
    chgWarning: {
        kex: {
            name: "SSH KEX Algorithms must be changed",
            description: "Weak SSH key exchange algorithms in use",
            hint: "Change these KEX algorithms"
        },
        key: {
            name: "SSH Key Algorithms must be changed",
            description: "Weak SSH key algorithms in use",
            hint: "Change these key algorithms"
        },
        mac: {
            name: "SSH MAC Algorithms must be changed",
            description: "Weak SSH message authentication code algorithms in use",
            hint: "Change these MAC algorithms"
        },
        enc: {
            name: "SSH Encryption Algorithms must be changed",
            description: "Weak SSH encryption algorithms in use",
            hint: "Change these encryption algorithms"
        }
    },
    addCritical: {
        kex: {
            name: "SSH KEX Algorithms must be added",
            description: "SSH key exchange algorithms missing",
            hint: "Add these KEX algorithms"
        },
        key: {
            name: "SSH Key Algorithms must be added",
            description: "SSH key algorithms missing",
            hint: "Add these key algorithms"
        },
        mac: {
            name: "SSH MAC Algorithms must be added",
            description: "SSH message authentication code algorithms missing",
            hint: "Add these MAC algorithms"
        },
        enc: {
            name: "SSH Encryption Algorithms must be added",
            description: "SSH encryption algorithms missing",
            hint: "Add these encryption algorithms"
        }
    },
    addWarning: {
        kex: {
            name: "SSH KEX Algorithms must be added",
            description: "SSH key exchange algorithms missing",
            hint: "Add these KEX algorithms"
        },
        key: {
            name: "SSH Key Algorithms must be added",
            description: "SSH key algorithms missing",
            hint: "Add these key algorithms"
        },
        mac: {
            name: "SSH MAC Algorithms must be added",
            description: "SSH message authentication code algorithms missing",
            hint: "Add these MAC algorithms"
        },
        enc: {
            name: "SSH Encryption Algorithms must be added",
            description: "SSH encryption algorithms missing",
            hint: "Add these encryption algorithms"
        }
    }
}

function foo2(algorithmData) {
    const algorithmNames = Object.entries(algorithmData).flatMap(([keyNames, content]) => (Object.values(content)) )
    return algorithmNames
};

/**
 * Transforms recommendations from the ssh-audit scanner into SSH Policy Violation Findings
 * @param {String} recommendationSeverityLevel 
 * @param {{}} value 
 */
function transformRecommendationToFinding(recommendationSeverityLevel, value) {
    // SSH audit has critical and warnings as recommendations. 
    // These are HIGH and MEDIUM severities, respectively
    const policyViolationFindings = [];
    let severity = 'LOW';
    if (recommendationSeverityLevel == 'critical') severity = 'HIGH'
    if (recommendationSeverityLevel == 'warning') severity = 'MEDIUM'
    const findingTemplate = null;
    // recommendationAction = del/chg/add
    Object.entries(value).map(([recommendationAction, algorithms]) => {
        //algorithmType = kex/ key/ mac, , algorithmNames = {name+note}
        Object.entries(algorithms).map(([algorithmType, algorithmData]) => {
            const algorithmNames = Object.entries(algorithmData).map(([keyNames, content]) => (Object.values(content)) )
            //console.log(algorithmData)
            //console.log(algorithmNames)
            //console.log(lala)
            let action = '';
            if (recommendationAction == 'del' && recommendationSeverityLevel == 'critical') action = 'delCritical'
            else if (recommendationAction == 'del' && recommendationSeverityLevel == 'warning') action = 'delWarning'
            else if (recommendationAction == 'chg' && recommendationSeverityLevel == 'critical') action = 'chgCritical'
            else if (recommendationAction == 'chg' && recommendationSeverityLevel == 'warning') action = 'chgWarning'
            else if (recommendationAction == 'add' && recommendationSeverityLevel == 'critical') action = 'addCritical'
            else if (recommendationAction == 'add' && recommendationSeverityLevel == 'warning') action = 'addWarning'
            const findingTemplate = templates[action][algorithmType] || null;

            if (findingTemplate != null && typeof (findingTemplate) != 'undefined') {
                findingTemplate['severity'] = severity
                findingTemplate['category'] = 'SSH Policy Violation'
                
                combinedAlgorithmNames = []
                algorithmNames.map(([algName, note]) => {
                    if (note == '') combinedAlgorithmNames.push(algName)
                    else combinedAlgorithmNames.push((algName + ' (Note: ' + note + ')'))
                })

                findingTemplate['algorithms'] = combinedAlgorithmNames.flat()
                policyViolationFindings.push(findingTemplate)
            }
        })
    })

    return policyViolationFindings;
}

/**
 * Transforms cves's from the ssh-audit scanner into SSH Violation Findings
 * @param {{}} cves 
 */
function transformCVEtoFinding(cves) {

    const cvesArray = Object.values(cves)
    const cvesFindings = []
    let severity = ''
    Object.values(cvesArray).flatMap(({cvssv2, description, name}) => {
        const findingTemplate = {}
        if (cvssv2 < 4) severity = 'LOW'
        else if (cvssv2 < 7) severity = 'MEDIUM'
        else severity = 'HIGH'
        findingTemplate['name'] = name
        findingTemplate['description'] = description
        findingTemplate['category'] = 'SSH Violation'
        findingTemplate['severity'] = severity
        findingTemplate['cvssv2'] = cvssv2

        findingTemplate['references'] = []
        findingTemplate['references'].push({'type':'CVE', 'value':`${name}`})
        findingTemplate['references'].push({'type':'URL', 'value':`https://nvd.nist.gov/vuln/detail/${name}`})
        cvesFindings.push(findingTemplate)
    })
    return cvesFindings;
}

/**
 * 
 * Parses the raw results from the ssh-audit scanner into Findings
 */
async function parse(fileContent) {

    const host = fileContent;
    if (typeof(host) === 'string') return []

    const recommendationsArray = Object.entries(host.recommendations)
    const policyViolationFindings = recommendationsArray.flatMap(
        ([recommendationSeverityLevel, value]) => transformRecommendationToFinding(recommendationSeverityLevel, value)
    )
    const cvesFindings = transformCVEtoFinding(host.cves)

    // informational findings
    const destination = host.target.split(':')
    const serviceFinding = {
        name: 'SSH Service',
        description: 'Information about Used SSH Algorithms',
        category: 'SSH Service',
        osi_layer: 'APPLICATION',
        severity: 'INFORMATIONAL',
        location: destination[0],
        attributes: {
            host: destination[0] || null,
            server_banner: host.banner?.raw || null,
            ssh_version: host.banner?.protocol[0] || null,
            ssh_lib_cpe: host.banner?.software,
            key_algorithms: host.key,
            encryption_algorithms: host.enc,
            mac_algorithms: host.mac,
            compression_algorithms: host.compression,
            key_exchange_algorithms: host.kex,
            fingerprints: host.fingerprints 
        }
    };
    return [serviceFinding, ...policyViolationFindings, ...cvesFindings];

}



module.exports.parse = parse;