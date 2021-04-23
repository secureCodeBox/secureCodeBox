const retry = require("../retry");

const { cascadingScan } = require("../helpers");

retry(
  "Cascading Scan nmap -> ncrack on dummy-ssh",
  3,
  async () => {
    const { categories, severities, count } = await cascadingScan(
      "nmap-dummy-ssh",
      "nmap",
      ["-Pn", "-sV", "dummy-ssh.demo-apps.svc"],
      {
        nameCascade: "ncrack-ssh",
        matchLabels: {
          "securecodebox.io/invasive": "invasive",
          "securecodebox.io/intensive": "high",
        },
      },
      120
    );

    expect(count).toBe(1);
    expect(categories).toEqual({
      "Discovered Credentials": 1,
    });
    expect(severities).toEqual({
      high: 1,
    });
  },
  3 * 60 * 1000
);
