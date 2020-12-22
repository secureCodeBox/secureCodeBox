const { getMessageCardByTemplate } = require("./msteams-template");

const vulnerabilityManagement = {
  enabled: true,
  name: "Kibana Dashboard",
  dashboardUrl: "htps://dashboard.yourservice/",
  dashboardFindingsUrl: "https://dashboard.yourservice/filter:09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
};

test("Test 1", async () => {

  const scan = {
    metadata: {
      uid: "09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
      name: "demo-scan-1601086432",
      namespace: "my-scans",
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

  expect(getMessageCardByTemplate(scan, vulnerabilityManagement) ).toMatchSnapshot();
});

test("Test 2", async () => {

  const scan = {
    metadata: {
      uid: "09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
      name: "demo-scan-1601086432",
      namespace: "my-scans",
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
        categories: {},
        count: 0,
        severities: {},
      },
      finishedAt: "2020-05-25T02:38:13Z",
      rawResultDownloadLink:
        "https://my-secureCodeBox-instance.com/scan-blkfsdg-sdgfsfgd-sfg-sdfg-dfsg-gfs98-e8af2172caa7/zap-results.json?Expires=1601691232",
      rawResultFile: "zap-results.json",
      rawResultType: "zap-json",
      state: "Done",
    },
  };

  expect(getMessageCardByTemplate(scan, vulnerabilityManagement) ).toMatchSnapshot();
});

test("Test 3", async () => {

  const scan = {
    metadata: {
      uid: "09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc",
      name: "demo-scan-1601086432",
      namespace: "my-scans",
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
      findings: {},
      finishedAt: "2020-05-25T02:38:13Z",
      rawResultDownloadLink:
        "https://my-secureCodeBox-instance.com/scan-blkfsdg-sdgfsfgd-sfg-sdfg-dfsg-gfs98-e8af2172caa7/zap-results.json?Expires=1601691232",
      rawResultFile: "zap-results.json",
      rawResultType: "zap-json",
      state: "Done",
    },
  };

  expect(getMessageCardByTemplate(scan, vulnerabilityManagement) ).toMatchSnapshot();
});
