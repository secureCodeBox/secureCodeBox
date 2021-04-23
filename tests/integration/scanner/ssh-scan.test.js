const retry = require("../retry");
// todo: Integrate into github ci pipeline
const { scan } = require("../helpers");

retry(
  "ssh-scan should find a couple of findings for a dummy ssh service",
  3,
  async () => {
    const { categories, severities, count } = await scan(
      "ssh-scan-dummy-ssh",
      "ssh-scan",
      ["-t", "dummy-ssh.demo-apps.svc"],
      90
    );

    expect(count).toBe(4);
    expect(categories).toMatchInlineSnapshot(`
      Object {
        "SSH Policy Violation": 3,
        "SSH Service": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      Object {
        "informational": 1,
        "medium": 3,
      }
    `);
  },
  3 * 60 * 1000
);

retry(
  "ssh-scan should gracefully handle a non-existing target",
  3,
  async () => {
    await expect(
      scan(
        "ssh-scan-non-existing",
        "ssh-scan",
        ["-t", "this-target-doesnt-exist.demo-apps.svc"],
        180
      )
    ).rejects.toThrow(
      'Scan failed with description "Failed to run the Scan Container, check k8s Job and its logs for more details"'
    );
  },
  3 * 60 * 1000
);
