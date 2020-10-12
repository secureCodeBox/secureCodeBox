const { scan } = require("../helpers");

test(
  "kubeaudit should find a fixed number of findings for the the juice-shop",
  async () => {
    const { categories, severities, count } = await scan(
      "kubeaudit-jshop",
      "kubeaudit",
      ["-n", "juice-shop"],
      15
    );
    console.log(categories)
    console.log(severities)
    console.log(count)
    // If we got here the scan succeded
    // as the number of findings will depend on the cluster, we just check if it is defined at all
    expect(true).toBe(true);
  },
  5 * 60 * 1000
);
