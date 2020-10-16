const { scan } = require("../helpers");

test(
  "kubeaudit should run and check the jshop in kubeaudit-tests namespace",
  async () => {
    const { categories, severities } = await scan(
      "kubeaudit-tests",
      "kubeaudit",
      ["-n", "kubeaudit-tests"],
      60
    );

    expect(categories).toMatchInlineSnapshot(`
      Object {
        "Automounted ServiceAccount Token": 1,
        "Capability Not Dropped": 14,
        "Non ReadOnly Root Filesystem": 1,
        "Non Root User Not Enforced": 1,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      Object {
        "low": 16,
        "medium": 1,
      }
    `);
  },
  5 * 60 * 1000
);
