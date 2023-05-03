const templates = {
    delCritical: {
        kex: {
            name: "Insecure SSH Kex Algorithms",
            description: "Discouraged SSH key exchange algorithms in use",
            hint: "Remove these Kex Algorithms"
        },
        key: {
            name: "Insecure SSH Key Algorithms",
            description: "Discouraged SSH Key Algorithms in use",
            hint: "Remove these Key Algorithms"
        },
        mac: {
            name: "Insecure SSH MAC Algorithms",
            description: "Discouraged SSH MAC algorithms in use",
            hint: "Remove these MAC Algorithms"
        },
        enc: {
            name: "Insecure SSH Encryption Algorithms",
            description: "Discouraged SSH Encryption algorithms are in use",
            hint: "Remove these MAC Algorithms"
        }
    },
    delWarning: {
        kex: {
            name: "Insecure SSH Kex Algorithms",
            description: "Discouraged SSH key exchange algorithms in use",
            hint: "Remove these Kex Algorithms"
        },
        key: {
            name: "Insecure SSH Key Algorithms",
            description: "Discouraged SSH Key Algorithms in use",
            hint: "Remove these Key Algorithms"
        },
        mac: {
            name: "Insecure SSH MAC Algorithms",
            description: "Discouraged SSH MAC algorithms in use",
            hint: "Remove these MAC Algorithms"
        },
        enc: {
            name: "Insecure SSH Encryption Algorithms",
            description: "Discouraged SSH Encryption algorithms in use",
            hint: "Remove these Encryption Algorithms"
        }
    },
    chgCritical: {
        kex: {
            name: "SSH Kex Algorithms must be changed",
            description: "Weak Key Exchange Algorithms in use",
            hint: "Change these Algorithms"
        },
        key: {
            name: "SSH Key Algorithms must be changed",
            description: "Weak Key Algorithms in use",
            hint: "Change these Algorithms"
        },
        mac: {
            name: "SSH MAC Algorithms must be changed",
            description: "Weak MAC Algorithms in use",
            hint: "Change these Algorithms"
        },
        enc: {
            name: "SSH Encryption Algorithms must be changed",
            description: "Weak Encryption Algorithms in use",
            hint: "Change these Algorithms"
        }
    },
    chgWarning: {
        kex: {
            name: "SSH Kex Algorithms must be changed",
            description: "Weak Key Exchange Algorithms in use",
            hint: "Change these Algorithms"
        },
        key: {
            name: "SSH Key Algorithms must be changed",
            description: "Weak Key Algorithms in use",
            hint: "Change these Algorithms"
        },
        mac: {
            name: "SSH MAC Algorithms must be changed",
            description: "Weak MAC Algorithms in use",
            hint: "Change these Algorithms"
        },
        enc: {
            name: "SSH Encryption Algorithms must be changed",
            description: "Weak Encryption Algorithms in use",
            hint: "Change these Algorithms"
        }
    }
}


/**
 * Transforms a recommendation string from thessh-audit Tools into a SSH Policy Violation Findings
 * 
 */
function transformRecommendationToFinding(recommendationSeverityLevel, value) {
    // SSH audit has critical and warnings as recommendations. 
    // These are HIGH and MEDIUM severities, respectively
    const policyViolationFindings = [];
    var severity = "low";
    if (recommendationSeverityLevel == "critical") severity = 'HIGH'
    if (recommendationSeverityLevel == "warning") severity = 'MEDIUM'
    const findingTemplate = null;
    // recommendationAction = del
    Object.entries(value).map(([recommendationAction, algorithms]) => {
        //algorithmType = kex/ key/ mac, , algorithmNames = {name+note}
        Object.entries(algorithms).map(([algorithmType, algorithmData]) => {
            const algorithmNames = []
            Object.entries(algorithmData).flatMap(([keyNames, content]) => { algorithmNames.push(Object.values(content)) })
            //console.log(algorithmNames)
            //console.log(algorithmData)
            var action = "";
            if (recommendationAction == "del" && recommendationSeverityLevel == "critical") action = "delCritical"
            else if (recommendationAction == "del" && recommendationSeverityLevel == "warning") action = "delWarning"
            else if (recommendationAction == "chg" && recommendationSeverityLevel == "critical") action = "chgCritical"
            else if (recommendationAction == "chg" && recommendationSeverityLevel == "warning") action = "chgWarning"
            const findingTemplate = templates[action][algorithmType] || null;

            if (findingTemplate != null && typeof (findingTemplate) != "undefined") {
                findingTemplate['severity'] = severity
                findingTemplate['category'] = "SSH Policy Violation"
                
                combinedAlgorithmNames = []
                algorithmNames.map(([algName, note]) => {
                    if (note == "") combinedAlgorithmNames.push(algName)
                    else combinedAlgorithmNames.push((algName + " (Note: " + note + ")"))
                })

                //console.log(combinedAlgorithmNames)
                findingTemplate['algorithms'] = combinedAlgorithmNames.flat()
                //console.log("algorithmType\n\n\n",algorithmType)
                //console.log("algorithmNames\n\n\n",algorithmNames)
                policyViolationFindings.push(findingTemplate)
                //console.log(findingTemplate)
            }
        })
    })

    return policyViolationFindings;
}

function transformCVEtoFinding(cves) {
    //console.log(Object.values(cves))
    const cvesArray = Object.values(cves)
    const cvesFindings = []
    Object.values(cvesArray).flatMap(({cvssv2, description, name}) => {
        //console.log(cvssv2, description, name )
        const findingTemplate = {}
        findingTemplate['name'] = name
        findingTemplate['description'] = description
        findingTemplate['cvssv2'] = cvssv2
        findingTemplate['URL'] = `https://nvd.nist.gov/vuln/detail/${name}`
        cvesFindings.push(findingTemplate)
    })
    return cvesFindings;
}

async function parse({ target, banner, enc, kex, key, mac, compression, fingerprints, recommendations, cves}) {
    const identified_at = new Date().toISOString();
    const recommendationsArray = Object.entries(recommendations)
    const policyViolationFindings = [];
    recommendationsArray.map(([recommendationSeverityLevel, value]) => {
        policyViolationFindings.push(transformRecommendationToFinding(recommendationSeverityLevel, value))
    })
    const policyViolationFinding = policyViolationFindings.flat()

    const cvesFindings = transformCVEtoFinding(cves)


    const destination = target.split(":")
    const serviceFinding = {
        name: "SSH Service",
        description: "SSH Service Information",
        identified_at: identified_at,
        category: "SSH Service",
        osi_layer: "APPLICATION",
        severity: "INFORMATIONAL",
        reference: {},
        mitigation: null,
        location: destination[0],
        attributes: {
            hostname: destination[0] || null,
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
    return [serviceFinding, ...policyViolationFinding, ...cvesFindings];
    //return [serviceFinding];

}
const test = { "banner": { "comments": "Ubuntu-4ubuntu2.8", "protocol": [2, 0], "raw": "SSH-2.0-OpenSSH_7.2p2 Ubuntu-4ubuntu2.8", "software": "OpenSSH_7.2p2" }, "compression": ["none", "zlib@openssh.com"], "cves": [{ "cvssv2": 7.0, "description": "privilege escalation via supplemental groups", "name": "CVE-2021-41617" }, { "cvssv2": 7.8, "description": "command injection via anomalous argument transfers", "name": "CVE-2020-15778" }, { "cvssv2": 5.3, "description": "username enumeration via GS2", "name": "CVE-2018-15919" }, { "cvssv2": 5.3, "description": "enumerate usernames due to timing discrepancies", "name": "CVE-2018-15473" }, { "cvssv2": 5.3, "description": "enumerate usernames via challenge response", "name": "CVE-2016-20012" }, { "cvssv2": 7.8, "description": "cause DoS via long password string (crypt CPU consumption)", "name": "CVE-2016-6515" }, { "cvssv2": 7.2, "description": "privilege escalation via triggering crafted environment", "name": "CVE-2015-8325" }], "enc": ["chacha20-poly1305@openssh.com", "aes128-ctr", "aes192-ctr", "aes256-ctr", "aes128-gcm@openssh.com", "aes256-gcm@openssh.com"], "fingerprints": [{ "hash": "eLwgzyjvrpwDbDr+pDbIfUhlNANB4DPH9/0w1vGa87E", "hash_alg": "SHA256", "hostkey": "ssh-ed25519" }, { "hash": "c8:65:6b:d1:59:03:56:21:d9:0f:84:83:ce:ac:40:86", "hash_alg": "MD5", "hostkey": "ssh-ed25519" }, { "hash": "MbRX/CgQyN6/p8/ZjORurfaJqDhu4VEIWfXo0BnxaCE", "hash_alg": "SHA256", "hostkey": "ssh-rsa" }, { "hash": "a5:6f:62:26:81:03:b7:5e:06:48:10:04:79:4b:ac:32", "hash_alg": "MD5", "hostkey": "ssh-rsa" }], "kex": [{ "algorithm": "curve25519-sha256@libssh.org" }, { "algorithm": "ecdh-sha2-nistp256" }, { "algorithm": "ecdh-sha2-nistp384" }, { "algorithm": "ecdh-sha2-nistp521" }, { "algorithm": "diffie-hellman-group-exchange-sha256", "keysize": 2048 }, { "algorithm": "diffie-hellman-group14-sha1" }], "key": [{ "algorithm": "ssh-rsa", "keysize": 2048 }, { "algorithm": "rsa-sha2-512", "keysize": 2048 }, { "algorithm": "rsa-sha2-256", "keysize": 2048 }, { "algorithm": "ecdsa-sha2-nistp256" }, { "algorithm": "ssh-ed25519" }], "mac": ["umac-64-etm@openssh.com", "umac-128-etm@openssh.com", "hmac-sha2-256-etm@openssh.com", "hmac-sha2-512-etm@openssh.com", "hmac-sha1-etm@openssh.com", "umac-64@openssh.com", "umac-128@openssh.com", "hmac-sha2-256", "hmac-sha2-512", "hmac-sha1"], "recommendations": { "critical": { "del": { "kex": [{ "name": "diffie-hellman-group14-sha1", "notes": "" }, { "name": "ecdh-sha2-nistp256", "notes": "" }, { "name": "ecdh-sha2-nistp384", "notes": "" }, { "name": "ecdh-sha2-nistp521", "notes": "" }], "key": [{ "name": "ecdsa-sha2-nistp256", "notes": "" }, { "name": "ssh-rsa", "notes": "" }], "mac": [{ "name": "hmac-sha1", "notes": "" }, { "name": "hmac-sha1-etm@openssh.com", "notes": "" }] } }, "warning": { "chg": { "key": [{ "name": "rsa-sha2-256", "notes": "increase modulus size to 3072 bits or larger" }, { "name": "rsa-sha2-512", "notes": "increase modulus size to 3072 bits or larger" }] }, "del": { "mac": [{ "name": "hmac-sha2-256", "notes": "" }, { "name": "hmac-sha2-512", "notes": "" }, { "name": "umac-128@openssh.com", "notes": "" }, { "name": "umac-64-etm@openssh.com", "notes": "" }, { "name": "umac-64@openssh.com", "notes": "" }] } } }, "target": "dummy-ssh.default.svc:22" }


console.log(parse(test))
//parse(test)
module.exports.parse = parse;