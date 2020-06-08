jest.mock("./scan-helpers");

const { handle } = require("./hook");
const { startSubsequentSecureCodeBoxScan } = require("./scan-helpers");

test("should create subsequent scans for https port", async () => {
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

  expect(startSubsequentSecureCodeBoxScan).toHaveBeenCalledTimes(2);

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
});
