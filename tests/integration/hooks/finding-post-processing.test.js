const { scan } = require('../helpers')

test(
  "Finding Post Processing after test-scan",
  async () => {
    const { severities, count, categories } = await scan(
      "finding-post-processing",
      "test-scan",
      [],
      90
    );

    expect(count).toBe(2);
    expect(severities.high === 1)
    expect(categories.SomeNewCategory === 1)
  },
  3 * 60 * 1000
);
