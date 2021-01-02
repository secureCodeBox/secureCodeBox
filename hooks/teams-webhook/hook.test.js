const { handle, isAnyRuleMatching, axios } = require("./hook");

beforeEach(() => {
  axios.post.mockClear();
});

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

test("Kibana enabled example should send a post request to the url when fired", async () => {
  const findings = [];
  const rules = [];

  const getFindings = async () => findings;

  const webhookUrl = "http://example.com/foo/bar";
  const vulnMngmEnabled = "true";
  const vulnMngmName = "Kibana Dashboard";
  const vulnMngmDashboardUrl = "htps://dashboard.yourservice/";
  const vulnMngmDashboardFindingsUrl =
    "https://dashboard.yourservice/filter:{{uid}}";

  await handle({
    getFindings,
    scan,
    webhookUrl,
    rules,
    vulnMngmEnabled,
    vulnMngmName,
    vulnMngmDashboardUrl,
    vulnMngmDashboardFindingsUrl,
  });

  expect(axios.post).toMatchSnapshot();
});

test("DefectDojo enabled should send a post request to the url when fired", async () => {
  const findings = [];
  const rules = [];

  const getFindings = async () => findings;

  const webhookUrl = "http://example.com/foo/bar";
  const vulnMngmEnabled = "true";
  const vulnMngmName = "DefectDojo";
  const vulnMngmDashboardUrl = "htps://defect.dojo/";
  const vulnMngmDashboardFindingsUrl = "https://defect.dojo/project?id={{uid}}";

  await handle({
    getFindings,
    scan,
    webhookUrl,
    rules,
    vulnMngmEnabled,
    vulnMngmName,
    vulnMngmDashboardUrl,
    vulnMngmDashboardFindingsUrl,
  });

  expect(axios.post).toMatchSnapshot();
});

test("vulnMngmEnabled disabled should should result in a minimal payload", async () => {
  const findings = [];
  const rules = [];

  const getFindings = async () => findings;

  const webhookUrl = "http://example.com/foo/bar";
  const vulnMngmEnabled = "false";
  const vulnMngmName = "";
  const vulnMngmDashboardUrl = "";
  const vulnMngmDashboardFindingsUrl = "";

  await handle({
    getFindings,
    scan,
    webhookUrl,
    rules,
    vulnMngmEnabled,
    vulnMngmName,
    vulnMngmDashboardUrl,
    vulnMngmDashboardFindingsUrl,
  });

  expect(axios.post).toMatchSnapshot();
});

test("Rules that didn't match shouldn't be send", async () => {
  const rulesWithoutMatch = [
    {
      matches: {
        anyOf: [
          {
            severity: "unkown",
          },
        ],
      },
    },
  ];

  const getFindings = async () => findings;

  const webhookUrl = "http://nofindings.com/foo/bar";
  const vulnMngmEnabled = "false";
  const vulnMngmName = "";
  const vulnMngmDashboardUrl = "";
  const vulnMngmDashboardFindingsUrl = "";

  await handle({
    getFindings,
    scan,
    webhookUrl,
    rules: rulesWithoutMatch,
    vulnMngmEnabled,
    vulnMngmName,
    vulnMngmDashboardUrl,
    vulnMngmDashboardFindingsUrl,
  });

  expect(axios.post).toMatchSnapshot();
});

test("vulnMngmEnabled some ENV Vars missing test should result in a minimal payload", async () => {
  const findings = [];
  const rules = [];

  const getFindings = async () => findings;

  const webhookUrl = "http://example.com/foo/bar";

  await handle({ getFindings, scan, webhookUrl, rules });

  expect(axios.post).toMatchSnapshot();
});

test("vulnMngmEnabled all ENV Vars missing test should result in a minimal payload", async () => {
  const findings = [];

  const getFindings = async () => findings;

  await expect(handle({ getFindings, scan })).rejects.toThrow(Error);
});

test("isAnyRuleMatching returns true if it matches correctly one rule", async () => {
  const rulesWithMatch = [
    {
      matches: {
        anyOf: [
          {
            severity: "INFORMATIONAL",
          },
        ],
      },
    },
  ];

  expect(isAnyRuleMatching(rulesWithMatch, findings)).toBeTruthy();
});

test("isAnyRuleMatching returns true if the rules array didn't contain any rule", async () => {
  const rulesEmpty = [];

  expect(isAnyRuleMatching(rulesEmpty, findings)).toBeTruthy();
});

test("isAnyRuleMatching returns false if it matches no rule.", async () => {
  const rulesWithoutMatch = [
    {
      matches: {
        anyOf: [
          {
            severity: "unkown",
          },
        ],
      },
    },
  ];

  expect(isAnyRuleMatching(rulesWithoutMatch, findings)).toBeFalsy();
});
