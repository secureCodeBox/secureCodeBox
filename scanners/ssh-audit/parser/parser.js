const templates = {
    del: {
        kex: {
            description: "Good / encouraged SSH compression algorithms are missing",
            name: "Insecure SSH Kex Algorithms",
            hint: "Remove this Kex Algorithm"
        },
        key: {
            description: "Good / encouraged SSH compression algorithms are missing",
            name: "Insecure SSH Key Algorithms",
            hint: "Remove this Key Algorithm"
        },
        mac: {
            description: "Good / encouraged SSH compression algorithms are missing",
            name: "Insecure SSH MAC Algorithms",
            hint: "Remove this MAC Algorithm"
        }
    },
    chg: {
        kex: {
            description: "Change Keks",
            name: "Change Kex Algorithm",
            hint: "Change this kex Algorthm"
        }
    }
}


/**
 * Transforms a recommendation string from thessh-audit Tools into a SSH Policy Violation Findings
 * 
 */
function transformRecommendationToFinding( recommendationSeverityLevel, value) {
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
                const findingTemplate = templates[recommendationAction][algorithmType] || null;
                if (findingTemplate != null && typeof(findingTemplate) != "undefined") {
                    findingTemplate['severity'] = severity
                    findingTemplate['category'] = "SSH Policy Violation"
                    //console.log("algorithmType\n\n\n",algorithmType)
                    //console.log("algorithmNames\n\n\n",algorithmNames)
                    policyViolationFindings.push(findingTemplate)
                }
            })
        })

        return policyViolationFindings;
}

async function parse({ target, banner, enc, kex, key, mac, compression, fingerprints, recommendations }) {
    const identified_at = new Date().toISOString();
    const recommendationsArray = Object.entries(recommendations)
    const policyViolationFindings = [];
    recommendationsArray.map(([recommendationSeverityLevel, value]) => {
        policyViolationFindings.push(transformRecommendationToFinding(recommendationSeverityLevel, value))
        
    })
    const policyViolationFinding = policyViolationFindings.flat()

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
    return [serviceFinding, ...policyViolationFinding];
    //return [serviceFinding];
    
}
const test = {
    "banner": {
        "comments": null,
        "protocol": [
            2,
            0
        ],
        "raw": "SSH-2.0-OpenSSH_7.4",
        "software": "OpenSSH_7.4"
    },
    "compression": [
        "none",
        "zlib@openssh.com"
    ],
    "cves": [
        {
            "cvssv2": 7.0,
            "description": "privilege escalation via supplemental groups",
            "name": "CVE-2021-41617"
        },
        {
            "cvssv2": 7.8,
            "description": "command injection via anomalous argument transfers",
            "name": "CVE-2020-15778"
        },
        {
            "cvssv2": 5.3,
            "description": "username enumeration via GS2",
            "name": "CVE-2018-15919"
        },
        {
            "cvssv2": 5.3,
            "description": "enumerate usernames due to timing discrepancies",
            "name": "CVE-2018-15473"
        },
        {
            "cvssv2": 5.3,
            "description": "enumerate usernames via challenge response",
            "name": "CVE-2016-20012"
        }
    ],
    "enc": [
        "chacha20-poly1305@openssh.com",
        "aes128-ctr",
        "aes192-ctr",
        "aes256-ctr",
        "aes128-gcm@openssh.com",
        "aes256-gcm@openssh.com",
        "aes256-cbc"
    ],
    "fingerprints": [
        {
            "hash": "3qsxEt/en/6s2C63H0wa4hBNb+VIR6TmOqGe8+jO2nY",
            "hash_alg": "SHA256",
            "hostkey": "ssh-ed25519"
        },
        {
            "hash": "e3:ca:d9:ad:6d:0f:6f:fc:80:b0:5c:57:dd:00:7f:da",
            "hash_alg": "MD5",
            "hostkey": "ssh-ed25519"
        },
        {
            "hash": "8xXJh7YPxGvEwjKQ157v85VDeFhB74S+tZvhh7AImdo",
            "hash_alg": "SHA256",
            "hostkey": "ssh-rsa"
        },
        {
            "hash": "70:9a:76:1b:42:52:49:15:ba:26:ed:d7:84:a0:3f:a3",
            "hash_alg": "MD5",
            "hostkey": "ssh-rsa"
        }
    ],
    "kex": [
        {
            "algorithm": "curve25519-sha256"
        },
        {
            "algorithm": "curve25519-sha256@libssh.org"
        },
        {
            "algorithm": "ecdh-sha2-nistp256"
        },
        {
            "algorithm": "ecdh-sha2-nistp384"
        },
        {
            "algorithm": "ecdh-sha2-nistp521"
        },
        {
            "algorithm": "diffie-hellman-group-exchange-sha256",
            "keysize": 1024
        },
        {
            "algorithm": "diffie-hellman-group16-sha512"
        },
        {
            "algorithm": "diffie-hellman-group18-sha512"
        },
        {
            "algorithm": "diffie-hellman-group-exchange-sha1",
            "keysize": 1024
        },
        {
            "algorithm": "diffie-hellman-group14-sha256"
        },
        {
            "algorithm": "diffie-hellman-group14-sha1"
        },
        {
            "algorithm": "diffie-hellman-group1-sha1"
        }
    ],
    "key": [
        {
            "algorithm": "ssh-rsa",
            "keysize": 2048
        },
        {
            "algorithm": "rsa-sha2-512",
            "keysize": 2048
        },
        {
            "algorithm": "rsa-sha2-256",
            "keysize": 2048
        },
        {
            "algorithm": "ecdsa-sha2-nistp256"
        },
        {
            "algorithm": "ssh-ed25519"
        }
    ],
    "mac": [
        "umac-64-etm@openssh.com",
        "umac-128-etm@openssh.com",
        "hmac-sha2-256-etm@openssh.com",
        "hmac-sha2-512-etm@openssh.com",
        "hmac-sha1-etm@openssh.com",
        "umac-64@openssh.com",
        "umac-128@openssh.com",
        "hmac-sha2-256",
        "hmac-sha2-512",
        "hmac-sha1"
    ],
    "recommendations": {
        "critical": {
            "chg": {
                "kex": [
                    {
                        "name": "diffie-hellman-group-exchange-sha256",
                        "notes": "increase modulus size to 3072 bits or larger"
                    }
                ]
            },
            "del": {
                "kex": [
                    {
                        "name": "diffie-hellman-group14-sha1",
                        "notes": ""
                    },
                    {
                        "name": "diffie-hellman-group1-sha1",
                        "notes": ""
                    },
                    {
                        "name": "diffie-hellman-group-exchange-sha1",
                        "notes": ""
                    },
                    {
                        "name": "ecdh-sha2-nistp256",
                        "notes": ""
                    },
                    {
                        "name": "ecdh-sha2-nistp384",
                        "notes": ""
                    },
                    {
                        "name": "ecdh-sha2-nistp521",
                        "notes": ""
                    }
                ],
                "key": [
                    {
                        "name": "ecdsa-sha2-nistp256",
                        "notes": ""
                    },
                    {
                        "name": "ssh-rsa",
                        "notes": ""
                    }
                ],
                "mac": [
                    {
                        "name": "hmac-sha1",
                        "notes": ""
                    },
                    {
                        "name": "hmac-sha1-etm@openssh.com",
                        "notes": ""
                    }
                ]
            }
        },
        "warning": {
            "chg": {
                "key": [
                    {
                        "name": "rsa-sha2-256",
                        "notes": "increase modulus size to 3072 bits or larger"
                    },
                    {
                        "name": "rsa-sha2-512",
                        "notes": "increase modulus size to 3072 bits or larger"
                    }
                ]
            },
            "del": {
                "enc": [
                    {
                        "name": "aes256-cbc",
                        "notes": ""
                    }
                ],
                "kex": [
                    {
                        "name": "diffie-hellman-group14-sha256",
                        "notes": ""
                    }
                ],
                "mac": [
                    {
                        "name": "hmac-sha2-256",
                        "notes": ""
                    },
                    {
                        "name": "hmac-sha2-512",
                        "notes": ""
                    },
                    {
                        "name": "umac-128@openssh.com",
                        "notes": ""
                    },
                    {
                        "name": "umac-64-etm@openssh.com",
                        "notes": ""
                    },
                    {
                        "name": "umac-64@openssh.com",
                        "notes": ""
                    }
                ]
            }
        }
    },
    "target": "iteratec.com:22"
}

console.log(parse(test))
module.exports.parse = parse;