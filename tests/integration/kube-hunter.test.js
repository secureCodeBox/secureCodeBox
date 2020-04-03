const { scan } = require("./helpers");

test(
  "kube-hunter should find a fixed number of findings for the kind cluster",
  async () => {
    const { categories, severities, count } = await scan(
      "kube-hunter-in-cluster",
      "kube-hunter",
      ["--pod", "--quick"],
      4 * 60
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
  5 * 60 * 1000
);
