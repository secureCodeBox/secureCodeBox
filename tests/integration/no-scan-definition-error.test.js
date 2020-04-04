const { scan } = require('./helpers')

test(
    "invalid port scan should be marked as errored",
    async () => {
      await expect(scan(
        "scan-type-not-found",
        "this-type-does-not-exists",
        [],
        30
      )).rejects.toThrow(`Scan failed with description "Configured ScanType 'this-type-does-not-exists' not found in Scans Namespace. You'll likely need to deploy the ScanType."`);
    },
    1 * 60 * 1000
  );