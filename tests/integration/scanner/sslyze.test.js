const { scan } = require("../helpers");

test(
  "Sslyze scans our website securecodebox.io",
  async () => {
    const { categories, severities, count } = await scan(
      "sslyze-securecodebox",
      "sslyze",
      ["--regular", "securecodebox.io"],
      90
    );

    expect(count).toBe(1);
    expect(categories).toMatchInlineSnapshot(`
      Object {
        "TLS Service Info": 1,
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

test(
  "Invalid argument should be marked as errored",
  async () => {
    await expect(
      scan(
      "sslyze-invalidArg",
      "sslyze",
      ["--invalidArg", "example.com"],
      90)
    ).rejects.toThrow("HTTP request failed");
  },
  3 * 60 * 1000
);
