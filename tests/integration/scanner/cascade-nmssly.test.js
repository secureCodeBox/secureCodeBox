const { cascadingScan } = require('../helpers')

test(
  "Cascading Scan nmap -> sslyze on securecodebox.io",
  async () => {
    const { categories, severities, count } = await cascadingScan(
      "nmap-securecodebox-sslyze",
      "nmap",
      ["-Pn", "-sV", "securecodebox.io"],
      {
        nameCascade: "https-tls-scan",
        matchLabels: {
          "securecodebox.io/invasive": "non-invasive",
          "securecodebox.io/intensive": "light"
        }
      },
      120
    );

    expect(count).toBe(1);
    expect(categories).toEqual(
      {
        "TLS Service Info": 1,
      }
    );
    expect(severities).toEqual(
      {
        "informational": 1,
      }
    );
  },
  3 * 60 * 1000
);
