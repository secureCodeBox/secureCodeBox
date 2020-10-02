const { cascadingScan } = require('../helpers')

test(
  "Cascading Scan nmap -> ncrack on dummy-ssh",
  async () => {
    const { categories, severities, count } = await cascadingScan(
      "nmap-dummy-ssh",
      "nmap",
      ["-Pn", "-sV", "dummy-ssh.demo-apps.svc"],
      "ncrack-ssh",
      "ncrack",
      ["-v", "--user=root,admin", "--pass=THEPASSWORDYOUCREATED,12345", "ssh://{{location}}"],
      "high",
      "invasive",
      120
    );

    expect(count).toBe(1);
        expect(categories).toEqual(
        {
            "Discovered Credentials": 1,
        }
        );
        expect(severities).toEqual(
        {
            "high": 1,
        }
        );
  },
  3 * 60 * 1000
);
