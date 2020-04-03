const { scan } = require("./helpers");

test(
  "kube-hunter should find a fixed number of findings for the kind cluster",
  async () => {
    const { categories, severities, count } = await scan(
      "kube-hunter-in-cluster",
      "kube-hunter",
      ["--pod"],
      120
    );

    expect(count).toBe(5);
    expect(categories).toMatchInlineSnapshot(`
      Object {
        "Access Risk": 3,
        "Information Disclosure": 2,
      }
    `);
    expect(severities).toMatchInlineSnapshot(`
      Object {
        "low": 3,
        "medium": 2,
      }
    `);
  },
  3 * 60 * 1000
);
