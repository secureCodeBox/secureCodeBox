jest.mock("./scan-helpers");

const { handle } = require("./hook");
const { startSubsequentSecureCodeBoxScan } = require("./scan-helpers");

test("Should create subsequent scans for open HTTPS ports (NMAP findings)", async () => {
  const findings = [
    {
      name: "Port 443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 443,
        service: "https",
      },
    },
    {
      name: "Port 8443 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "example.com",
        port: 8443,
        service: "ssl",
      },
    },
  ];

  const scan = {
    metadata: {
      labels: {
        foo: "bar",
      },
    },
  };

  const getFindings = async () => findings;

  await handle({
    getFindings,
    scan,
  });

  expect(startSubsequentSecureCodeBoxScan).toHaveBeenCalledTimes(4);

  expect(startSubsequentSecureCodeBoxScan).toHaveBeenNthCalledWith(1, {
    name: "sslyze-foobar.com",
    parameters: ["--regular", "foobar.com"],
    parentScan: { metadata: { labels: { foo: "bar" } } },
    scanType: "sslyze",
  });
  expect(startSubsequentSecureCodeBoxScan).toHaveBeenNthCalledWith(2, {
    name: "zap-foobar.com",
    parameters: ["-t", "https://foobar.com:443"],
    parentScan: { metadata: { labels: { foo: "bar" } } },
    scanType: "zap-baseline",
  });
  // even if the HTTP port is not running at port 80 a corresponding Nikto scan should be created if a HTTP service is found by nmap
  expect(startSubsequentSecureCodeBoxScan).toHaveBeenNthCalledWith(3, {
    name: "sslyze-example.com",
    parameters: ["--regular", "example.com"],
    parentScan: { metadata: { labels: { foo: "bar" } } },
    scanType: "sslyze",
  });
  expect(startSubsequentSecureCodeBoxScan).toHaveBeenNthCalledWith(4, {
    name: "zap-example.com",
    parameters: ["-t", "https://example.com:8443"],
    parentScan: { metadata: { labels: { foo: "bar" } } },
    scanType: "zap-baseline",
  });
});

test("Should create subsequent scans for open HTTP ports (NMAP findings)", async () => {
  const findings = [
    {
      name: "Port 80 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 80,
        service: "http",
      },
    },
    {
      name: "Port 3000 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "example.com",
        port: 3000,
        service: "http",
      },
    },
  ];

  const scan = {
    metadata: {
      labels: {
        foo: "bar",
      },
    },
  };

  const getFindings = async () => findings;

  await handle({
    getFindings,
    scan,
  });

  expect(startSubsequentSecureCodeBoxScan).toHaveBeenCalledTimes(6);

  expect(startSubsequentSecureCodeBoxScan).toHaveBeenNthCalledWith(5, {
    name: "nikto-foobar.com",
    parameters: ["-h", "https://foobar.com", "-Tuning", "1,2,3,5,7,b"],
    parentScan: { metadata: { labels: { foo: "bar" } } },
    scanType: "nikto",
  });
  // even if the HTTP port is not running at port 80 a corresponding Nikto scan should be created if a HTTP service is found by nmap
  expect(startSubsequentSecureCodeBoxScan).toHaveBeenNthCalledWith(6, {
    name: "nikto-example.com",
    parameters: ["-h", "https://example.com", "-Tuning", "1,2,3,5,7,b"],
    parentScan: { metadata: { labels: { foo: "bar" } } },
    scanType: "nikto",
  });
});

test("Should create subsequent scans for open SSH ports (NMAP findings)", async () => {
  const findings = [
    {
      name: "Port 22 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "foobar.com",
        port: 22,
        service: "ssh",
      },
    },
    {
      name: "Port 23454 is open",
      category: "Open Port",
      attributes: {
        state: "open",
        hostname: "example.com",
        port: 23454,
        service: "ssh",
      },
    },
  ];

  const scan = {
    metadata: {
      labels: {
        foo: "bar",
      },
    },
  };

  const getFindings = async () => findings;

  await handle({
    getFindings,
    scan,
  });

  expect(startSubsequentSecureCodeBoxScan).toHaveBeenCalledTimes(8);

  expect(startSubsequentSecureCodeBoxScan).toHaveBeenNthCalledWith(7, {
    name: "ssh-foobar.com",
    parameters: ["-t", "foobar.com"],
    parentScan: { metadata: { labels: { foo: "bar" } } },
    scanType: "ssh-scan",
  });
  // even if the HTTP port is not running at port 80 a corresponding Nikto scan should be created if a HTTP service is found by nmap
  expect(startSubsequentSecureCodeBoxScan).toHaveBeenNthCalledWith(8, {
    name: "ssh-example.com",
    parameters: ["-t", "example.com"],
    parentScan: { metadata: { labels: { foo: "bar" } } },
    scanType: "ssh-scan",
  });
});

test("Should create subsequent scans for subdomains (AMASS findings)", async () => {
  const findings = [
    {
      name: "www.example.com",
      description: "Found subdomain www.example.com",
      category: "Subdomain",
      location: "www.example.com",
      osi_layer: "NETWORK",
      severity: "INFORMATIONAL",
    },
    {
      name: "example.example.com",
      description: "Found subdomain example.example.com",
      category: "Subdomain",
      location: "example.example.com",
      osi_layer: "NETWORK",
      severity: "INFORMATIONAL",
    },
  ];

  const scan = {
    metadata: {
      labels: {
        foo: "bar",
      },
    },
  };

  const getFindings = async () => findings;

  await handle({
    getFindings,
    scan,
  });

  expect(startSubsequentSecureCodeBoxScan).toHaveBeenCalledTimes(10);

  expect(startSubsequentSecureCodeBoxScan).toHaveBeenNthCalledWith(9, {
    name: "nmap-www.example.com",
    parameters: ["-Pn", "www.example.com"],
    parentScan: { metadata: { labels: { foo: "bar" } } },
    scanType: "nmap",
  });
  // even if the HTTP port is not running at port 80 a corresponding Nikto scan should be created if a HTTP service is found by nmap
  expect(startSubsequentSecureCodeBoxScan).toHaveBeenNthCalledWith(10, {
    name: "nmap-example.example.com",
    parameters: ["-Pn", "example.example.com"],
    parentScan: { metadata: { labels: { foo: "bar" } } },
    scanType: "nmap",
  });
});