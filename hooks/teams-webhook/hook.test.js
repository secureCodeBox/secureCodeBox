const { handle, axios } = require("./hook");

beforeEach(() => {
  axios.post.mockClear();
});

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
    findingDownloadLink: "https://my-secureCodeBox-instance.com/scan-b9as-sdweref--sadf-asdfsdf-dasdgf-asdffdsfa7/findings.json",
    findings: {
        "categories": {
            "A Client Error response code was returned by the server": 1,
            "Information Disclosure - Sensitive Information in URL": 1,
            "Strict-Transport-Security Header Not Set": 1
        },
        count: 3,
        severities: {
          "high": 10,
          "medium": 5,
          "low": 2,
          "informational": 1,
        }
    },
    finishedAt: "2020-05-25T02:38:13Z",
    rawResultDownloadLink: "https://my-secureCodeBox-instance.com/scan-blkfsdg-sdgfsfgd-sfg-sdfg-dfsg-gfs98-e8af2172caa7/zap-results.json?Expires=1601691232",
    rawResultFile: "zap-results.json",
    rawResultType: "zap-json",
    state: "Done"
  }
};

test("Kibana enabled example should send a post request to the url when fired", async () => {
  const findings = [];

  const getFindings = async () => findings;

  const webhookUrl = "http://example.com/foo/bar";
  const vulnMngmEnabled = "true";
  const vulnMngmName = "Kibana Dashboard";
  const vulnMngmDashboardUrl = "htps://dashboard.yourservice/";
  const vulnMngmDashboardFindingsUrl = "https://dashboard.yourservice/filter:09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc";

  await handle({ getFindings, scan, webhookUrl, vulnMngmEnabled, vulnMngmName, vulnMngmDashboardUrl, vulnMngmDashboardFindingsUrl });

  expect(axios.post).toMatchSnapshot();
});

test("DefectDojo enabled should send a post request to the url when fired", async () => {
  const findings = [];

  const getFindings = async () => findings;

  const webhookUrl = "http://example.com/foo/bar";
  const vulnMngmEnabled = "true";
  const vulnMngmName = "DefectDojo";
  const vulnMngmDashboardUrl = "htps://defect.dojo/";
  const vulnMngmDashboardFindingsUrl = "https://defect.dojo/project?id=09988cdf-1fc7-4f85-95ee-1b1d65dbc7cc";

  await handle({ getFindings, scan, webhookUrl, vulnMngmEnabled, vulnMngmName, vulnMngmDashboardUrl, vulnMngmDashboardFindingsUrl });

  expect(axios.post).toMatchSnapshot();
});

test("vulnMngmEnabled disabled should should result in a minimal payload", async () => {
  const findings = [];

  const getFindings = async () => findings;

  const webhookUrl = "http://example.com/foo/bar";
  const vulnMngmEnabled = "false";
  const vulnMngmName = "";
  const vulnMngmDashboardUrl = "";
  const vulnMngmDashboardFindingsUrl = "";

  await handle({ getFindings, scan, webhookUrl, vulnMngmEnabled, vulnMngmName, vulnMngmDashboardUrl, vulnMngmDashboardFindingsUrl });

  expect(axios.post).toMatchSnapshot();
});

test("vulnMngmEnabled ENV Vars missing test should result in a minimal payload", async () => {
  const findings = [];

  const getFindings = async () => findings;

  const webhookUrl = "http://example.com/foo/bar";

  await handle({ getFindings, scan, webhookUrl });
  
  expect(axios.post).toMatchSnapshot();
});

