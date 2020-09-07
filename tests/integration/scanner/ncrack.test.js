const { scan } = require('../helpers')

test(
    "ncrack should find 1 credential in vulnerable ssh service",
    async () => {
        const { categories, severities, count } = await scan(
            "ncrack-dummy-ssh",
            "ncrack",
            ["--user", "root,admin", "--pass", "password,123456,THEPASSWORDYOUCREATED", "ssh://dummy-ssh.demo-apps.svc"],
            90
        );

        expect(count).toBe(1);
        expect(categories).toMatchInlineSnapshot(`
        Object {
            "Discovered Credentials": 1,
        }
        `);
        expect(severities).toMatchInlineSnapshot(`
        Object {
            "high": 1,
        }
        `);
    },
    3 * 60 * 1000
);