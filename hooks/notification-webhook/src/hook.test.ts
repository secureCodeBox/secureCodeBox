import { handle, matches } from "./hook";
import { Finding } from "./model/Finding";

const scan = {
  metadata: {
    uid: "09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
    name: "demo-scan-1601086432",
    namespace: "my-scans",
    creationTimestamp: "2021-01-01T14:29:25Z",
    labels: {
      company: "iteratec",
      "attack-surface": "external",
    },
  },
  spec: {
    scanType: "Nmap",
    parameters: ["-Pn", "localhost"],
  },
  status: {
    findingDownloadLink:
      "https://my-secureCodeBox-instance.com/scan-b9as-sdweref--sadf-asdfsdf-dasdgf-asdffdsfa7/findings.json",
    findings: {
      categories: {
        "A Client Error response code was returned by the server": 1,
        "Information Disclosure - Sensitive Information in URL": 1,
        "Strict-Transport-Security Header Not Set": 1,
      },
      count: 3,
      severities: {
        high: 10,
        medium: 5,
        low: 2,
        informational: 1,
      },
    },
    finishedAt: "2020-05-25T02:38:13Z",
    rawResultDownloadLink:
      "https://my-secureCodeBox-instance.com/scan-blkfsdg-sdgfsfgd-sfg-sdfg-dfsg-gfs98-e8af2172caa7/zap-results.json?Expires=1601691232",
    rawResultFile: "zap-results.json",
    rawResultType: "zap-json",
    state: "Done",
  },
};

const findings = [
  {
    name: "SSH Service",
    description: "SSH Service Information",
    category: "SSH Service",
    osi_layer: "APPLICATION",
    severity: "INFORMATIONAL",
    reference: {},
    hint: "",
    location: "dummy-ssh.demo-apps.svc",
    attributes: {
      hostname: "dummy-ssh.demo-apps.svc",
      ip_address: "10.102.131.102",
      server_banner: "SSH-2.0-OpenSSH_7.2p2 Ubuntu-4ubuntu2.8",
      ssh_version: 2,
      os_cpe: "o:canonical:ubuntu:16.04",
      ssh_lib_cpe: "a:openssh:openssh:7.2p2",
      compliance_policy: "Mozilla Modern",
      compliant: false,
      grade: "D",
      references: ["https://wiki.mozilla.org/Security/Guidelines/OpenSSH"],
      auth_methods: ["publickey", "password"],
      key_algorithms: [
        "curve25519-sha256@libssh.org",
        "ecdh-sha2-nistp256",
        "ecdh-sha2-nistp384",
        "ecdh-sha2-nistp521",
        "diffie-hellman-group-exchange-sha256",
        "diffie-hellman-group14-sha1",
      ],
      encryption_algorithms: [
        "chacha20-poly1305@openssh.com",
        "aes128-ctr",
        "aes192-ctr",
        "aes256-ctr",
        "aes128-gcm@openssh.com",
        "aes256-gcm@openssh.com",
      ],
      mac_algorithms: [
        "umac-64-etm@openssh.com",
        "umac-128-etm@openssh.com",
        "hmac-sha2-256-etm@openssh.com",
        "hmac-sha2-512-etm@openssh.com",
        "hmac-sha1-etm@openssh.com",
        "umac-64@openssh.com",
        "umac-128@openssh.com",
        "hmac-sha2-256",
        "hmac-sha2-512",
        "hmac-sha1",
      ],
      compression_algorithms: ["none", "zlib@openssh.com"],
    },
    id: "17ac9886-d083-4c58-8518-557aa3b38d2d",
  },
  {
    name: "Insecure SSH Key Algorithms",
    description: "Deprecated / discouraged SSH key algorithms are used",
    category: "SSH Policy Violation",
    osi_layer: "NETWORK",
    severity: "MEDIUM",
    reference: {},
    hint: "Remove these key exchange algorithms: diffie-hellman-group14-sha1",
    location: "dummy-ssh.demo-apps.svc",
    attributes: {
      hostname: "dummy-ssh.demo-apps.svc",
      ip_address: "10.102.131.102",
      payload: ["diffie-hellman-group14-sha1"],
    },
    id: "650c5ed1-00fb-44e3-933c-515dca4a1eda",
  },
  {
    name: "Insecure SSH MAC Algorithms",
    description: "Deprecated / discouraged SSH MAC algorithms are used",
    category: "SSH Policy Violation",
    osi_layer: "NETWORK",
    severity: "MEDIUM",
    reference: {},
    hint:
      "Remove these MAC algorithms: umac-64-etm@openssh.com, hmac-sha1-etm@openssh.com, umac-64@openssh.com, hmac-sha1",
    location: "dummy-ssh.demo-apps.svc",
    attributes: {
      hostname: "dummy-ssh.demo-apps.svc",
      ip_address: "10.102.131.102",
      payload: [
        "umac-64-etm@openssh.com",
        "hmac-sha1-etm@openssh.com",
        "umac-64@openssh.com",
        "hmac-sha1",
      ],
    },
    id: "5b681ed0-b509-400b-bb1e-ae839bb1b766",
  },
  {
    name: "Discouraged SSH authentication methods",
    description: "Discouraged SSH authentication methods are used",
    category: "SSH Policy Violation",
    osi_layer: "NETWORK",
    severity: "MEDIUM",
    reference: {},
    hint: "Remove these authentication methods: password",
    location: "dummy-ssh.demo-apps.svc",
    attributes: {
      hostname: "dummy-ssh.demo-apps.svc",
      ip_address: "10.102.131.102",
      payload: ["password"],
    },
    id: "4485916d-3747-4c16-a730-a9b1146dd9a2",
  },
];

test("Should Match for High Severity Findings", async () => {
  const finding: Finding = {
    name: "test finding",
    location: "hostname",
    category: "Open Port",
    severity: "high",
    osi_layer: "asdf",
    attributes: new Map(),
  };

  const rules = [{
    matches: {
      anyOf: [
        {
          severity: "high"
        }
      ]
    },
  }]
  expect(matches(finding, rules)).toBeTruthy();
})

test("Should Not Match for High Severity Findings", async () => {
  const finding: Finding = {
    name: "test finding",
    location: "hostname",
    category: "Open Port",
    severity: "high",
    osi_layer: "asdf",
    attributes: new Map(),
  };

  const rules = [{
    matches: {
      anyOf: [
        {
          severity: "NOT HIGH"
        }
      ]
    },
  }]
  expect(matches(finding, rules)).toBeFalsy();

})

test("Should Match for Multiple 'anyOf' Rules", async () => {
  const finding: Finding = {
    name: "test finding",
    location: "hostname",
    category: "Open Port",
    severity: "high",
    osi_layer: "asdf",
    attributes: new Map(),
  };

  const rules = [{
    matches: {
      anyOf: [
        {
          severity: "NOT HIGH"
        },
        {
          category: "Open Port",
        }
      ]
    },
  }]
  expect(matches(finding, rules)).toBeTruthy();
})

test("Should NOT Match Multiple 'anyOf' Rules", async () => {
  const finding: Finding = {
    name: "test finding",
    location: "hostname",
    category: "Open Port",
    severity: "high",
    osi_layer: "asdf",
    attributes: new Map(),
  };

  const rules = [{
    matches: {
      anyOf: [
        {
          severity: "NOT HIGH"
        },
        {
          category: "NOT OPEN PORT"
        }
      ]
    },
  }]

  expect(matches(finding, rules)).toBeFalsy();
})

test("Should Match Multiple 'and' Rules", async () => {
  const finding: Finding = {
    name: "test finding",
    location: "hostname",
    category: "Open Port",
    severity: "high",
    osi_layer: "asdf",
    attributes: new Map(),
  };

  const rules = [
    {
      matches: {
        anyOf: [
          {
            severity: "high"
          }
        ]
      },
    },
    {
      matches: {
        anyOf: [
          {
            category: "Open Port"
          }
        ]
      },
    },
  ]

  expect(matches(finding, rules)).toBeTruthy();
})

test("Should Not Match Multiple 'and' Rules", async () => {
  const finding: Finding = {
    name: "test finding",
    location: "hostname",
    category: "Open Port",
    severity: "high",
    osi_layer: "asdf",
    attributes: new Map(),
  };

  const rules = [
    {
      matches: {
        anyOf: [
          {
            severity: "high"
          }
        ]
      },
    },
    {
      matches: {
        anyOf: [
          {
            severity: "low"
          }
        ]
      },
    },
  ]

  expect(matches(finding, rules)).toBeFalsy();
})
