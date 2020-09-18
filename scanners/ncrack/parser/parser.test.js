const { parse } = require('./parser');
const fs = require('fs');

it('should return no findings when ncrack has not found credentials', async () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const ncrackXML = fs.readFileSync(__dirname + '/__testFiles__/ncrack_no_results.xml', {
        encoding: 'utf8',
    });
    const findings = await parse(ncrackXML);

    expect(findings.length).toBe(0);
});

it('should return findings when ncrack found credentials', async () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const ncrackXML = fs.readFileSync(__dirname + '/__testFiles__/ncrack_with_results.xml', {
        encoding: 'utf8',
    });
    const [finding, ...otherFindings] = await parse(ncrackXML);

    expect(finding).toMatchInlineSnapshot(`
        Object {
          "attributes": Object {
            "ip_address": "192.168.0.1",
            "password": "aaf076d4fe7cfb63fd1628df91",
            "port": "22",
            "protocol": "tcp",
            "service": "ssh",
            "username": "root",
          },
          "category": "Discovered Credentials",
          "description": "",
          "location": "ssh://192.168.0.1:22",
          "name": "Credentials for Service ssh://192.168.0.1:22 discovered via bruteforce.",
          "osi_layer": "APPLICATION",
          "severity": "HIGH",
        }
    `);
    expect(otherFindings.length).toBe(0);
});

it('should return no findings when ncrack has not found credentials scanning two services', async () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const ncrackXML = fs.readFileSync(
        __dirname + '/__testFiles__/ncrack_two_services_no_results.xml',
        {
            encoding: 'utf8',
        }
    );
    const findings = await parse(ncrackXML);

    expect(findings.length).toBe(0);
});

it('should return findings when ncrack found two credentials scanning two services', async () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const ncrackXML = fs.readFileSync(
        __dirname + '/__testFiles__/ncrack_two_services_with_results.xml',
        {
            encoding: 'utf8',
        }
    );

    expect(await parse(ncrackXML)).toMatchInlineSnapshot(`
        Array [
          Object {
            "attributes": Object {
              "ip_address": "192.168.0.2",
              "password": "55994bcdabd8b0b69d4cb32919",
              "port": "22",
              "protocol": "tcp",
              "service": "ssh",
              "username": "root",
            },
            "category": "Discovered Credentials",
            "description": "",
            "location": "ssh://192.168.0.2:22",
            "name": "Credentials for Service ssh://192.168.0.2:22 discovered via bruteforce.",
            "osi_layer": "APPLICATION",
            "severity": "HIGH",
          },
          Object {
            "attributes": Object {
              "ip_address": "192.168.0.1",
              "password": "2a4707625af87d8d4302ad226d",
              "port": "22",
              "protocol": "tcp",
              "service": "ssh",
              "username": "root",
            },
            "category": "Discovered Credentials",
            "description": "",
            "location": "ssh://192.168.0.1:22",
            "name": "Credentials for Service ssh://192.168.0.1:22 discovered via bruteforce.",
            "osi_layer": "APPLICATION",
            "severity": "HIGH",
          },
        ]
    `);
});

