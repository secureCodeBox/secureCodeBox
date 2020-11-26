const { scan } = require('../helpers')

test(
  "Finding Post Processing after test-scan",
  async () => {
    const { severities, count } = await scan(
      "finding-post-processing",
      "test-scan",
      [],
      90
    );

    expect(count).toBe(2);
    expect(severities.high).toBe(1)
  },
  3 * 60 * 1000
);
