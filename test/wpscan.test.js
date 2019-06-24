const { startSecurityTest, Time } = require('./sdk');

test(
    'finds a few informational severity findigns for www.iteraplan.de',
    async () => {
        const securityTest = await startSecurityTest({
            context: 'iteraplan wp',
            metaData: {},
            name: 'wordpress',
            target: {
                name: 'iteraplan',
                location: 'www.iteraplan.de',
                attributes: {},
            },
        });

        const { report } = securityTest;

        const findings = report.findings.map(
            ({ description, category, name, osi_layer, severity }) => ({
                description,
                category,
                name,
                osi_layer,
                severity,
            })
        );

        expect(findings).toContainEqual({
            description: 'CMS Wordpress Information',
            category: 'CMS Wordpress',
            name: 'CMS Wordpress',
            osi_layer: 'APPLICATION',
            severity: 'INFORMATIONAL',
        });

        expect(findings).toContainEqual({
            description: ' Username & Hash Extract',
            category: 'Plugin',
            name: 'W3 Total Cache 0.9.2.4 ',
            osi_layer: 'APPLICATION',
            severity: 'INFORMATIONAL',
        });

        expect(findings).toContainEqual({
            description: ' Remote Code Execution',
            category: 'Plugin',
            name: 'W3 Total Cache ',
            osi_layer: 'APPLICATION',
            severity: 'INFORMATIONAL',
        });

        expect(findings).toContainEqual({
            description: ' Edge Mode Enabling CSRF',
            category: 'Plugin',
            name: 'W3 Total Cache 0.9.4 ',
            osi_layer: 'APPLICATION',
            severity: 'INFORMATIONAL',
        });

        expect(findings).toContainEqual({
            description: ' Cross',
            category: 'Plugin',
            name: 'W3 Total Cache <= 0.9.4 ',
            osi_layer: 'APPLICATION',
            severity: 'INFORMATIONAL',
        });

        expect(findings).toContainEqual({
            description: ' Debug Mode XSS',
            category: 'Plugin',
            name: 'W3 Total Cache <= 0.9.4 ',
            osi_layer: 'APPLICATION',
            severity: 'INFORMATIONAL',
        });

        expect(findings).toContainEqual({
            description: ' Authenticated Reflected Cross',
            category: 'Plugin',
            name: 'W3 Total Cache <= 0.9.4.1 ',
            osi_layer: 'APPLICATION',
            severity: 'INFORMATIONAL',
        });
    },
    7 * Time.Minute
);