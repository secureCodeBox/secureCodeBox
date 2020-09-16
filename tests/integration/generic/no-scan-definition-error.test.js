const { scan } = require("../helpers");

test(
  "scan without a matching ScanType should be marked as errored",
  async () => {
    await expect(
      scan("scan-type-not-found", "this-type-does-not-exists", [], 30)
    ).rejects.toThrow(
      `Scan failed with description "Configured ScanType 'this-type-does-not-exists' not found in 'integration-tests' namespace. You'll likely need to deploy the ScanType."`
    );
  },
  1 * 60 * 1000
);
