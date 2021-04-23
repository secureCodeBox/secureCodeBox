const retry = require("../retry");

const { scan } = require("../helpers");

retry(
  "localhost port scan should only find a host finding",
  3,
  async () => {
    const { categories, severities, count } = await scan(
      "nmap-localhost",
      "nmap",
      ["localhost"],
      90
    );

    expect(count).toBe(1);
    expect(categories).toMatchInlineSnapshot(`
      Object {
        "Host": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      Object {
        "informational": 1,
      }
    `);
  },
  3 * 60 * 1000
);

retry(
  "invalid port scan should be marked as errored",
  3,
  async () => {
    await expect(
      scan("nmap-localhost", "nmap", ["-invalidFlag", "localhost"], 90)
    ).rejects.toThrow(
      'Scan failed with description "Failed to run the Scan Container, check k8s Job and its logs for more details"'
    );
  },
  3 * 60 * 1000
);
