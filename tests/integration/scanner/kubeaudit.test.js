const { scan } = require("../helpers");

test(
  "kubeaudit should run and check our integration-tests namespace",
  async () => {
    const { _ } = await scan(
      "kubeaudit-test",
      "kubeaudit",
      ["-n", "integration-tests"],
      20
    );
    
    // If we got here the scan succeded
    expect(true).toBe(true);
  },
  5 * 60 * 1000
);
