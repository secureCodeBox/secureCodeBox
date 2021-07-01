// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const util = require("util");
const {
  validate_parser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const { parse } = require("./parser");

test("should properly parse nmap xml file", async () => {
  const xmlContent = await readFile(
    __dirname + "/__testFiles__/localhost.xml",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(xmlContent);
  // validate findings
  await expect(validate_parser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
    Array [
      Object {
        "attributes": Object {
          "hostname": "localhost",
          "ip_address": "127.0.0.1",
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 53,
          "protocol": "tcp",
          "scripts": null,
          "service": "domain",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 53 is open using tcp protocol.",
        "location": "tcp://127.0.0.1:53",
        "name": "domain",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      Object {
        "attributes": Object {
          "hostname": "localhost",
          "ip_address": "127.0.0.1",
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 8021,
          "protocol": "tcp",
          "scripts": null,
          "service": "ftp-proxy",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 8021 is open using tcp protocol.",
        "location": "tcp://127.0.0.1:8021",
        "name": "ftp-proxy",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      Object {
        "attributes": Object {
          "hostname": "localhost",
          "ip_address": "127.0.0.1",
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 8080,
          "protocol": "tcp",
          "scripts": null,
          "service": "http-proxy",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 8080 is open using tcp protocol.",
        "location": "tcp://127.0.0.1:8080",
        "name": "http-proxy",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      Object {
        "attributes": Object {
          "hostname": "localhost",
          "ip_address": "127.0.0.1",
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 9200,
          "protocol": "tcp",
          "scripts": null,
          "service": "wap-wsp",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 9200 is open using tcp protocol.",
        "location": "tcp://127.0.0.1:9200",
        "name": "wap-wsp",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      Object {
        "attributes": Object {
          "hostname": "localhost",
          "ip_address": "127.0.0.1",
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": "localhost",
        "name": "Host: localhost",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});

test("should properly parse a nmap xml without any ports", async () => {
  const xmlContent = await readFile(__dirname + "/__testFiles__/no-ports.xml", {
    encoding: "utf8",
  });

  expect(await parse(xmlContent)).toMatchInlineSnapshot(`
    Array [
      Object {
        "attributes": Object {
          "hostname": "localhost",
          "ip_address": "127.0.0.1",
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": "localhost",
        "name": "Host: localhost",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});

test("should properly parse a nmap xml without any host", async () => {
  const xmlContent = await readFile(__dirname + "/__testFiles__/no-host.xml", {
    encoding: "utf8",
  });

  expect(await parse(xmlContent)).toMatchInlineSnapshot(`Array []`);
});

test("should properly parse a nmap xml with missing service information", async () => {
  const xmlContent = await readFile(
    __dirname + "/__testFiles__/no-service.xml",
    {
      encoding: "utf8",
    }
  );

  expect(await parse(xmlContent)).toMatchInlineSnapshot(`
    Array [
      Object {
        "attributes": Object {
          "hostname": "example.com",
          "ip_address": "93.184.216.34",
          "mac_address": null,
          "method": undefined,
          "operating_system": null,
          "port": 10250,
          "protocol": "tcp",
          "scripts": null,
          "service": undefined,
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "filtered",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 10250 is filtered using tcp protocol.",
        "location": "tcp://93.184.216.34:10250",
        "name": undefined,
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      Object {
        "attributes": Object {
          "hostname": "example.com",
          "ip_address": "93.184.216.34",
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": "example.com",
        "name": "Host: example.com",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});

test("Should properly parse a nmap xml with script specific SMB findings", async () => {
  const xmlContent = await readFile(
    __dirname + "/__testFiles__/localhost-smb-script.xml",
    {
      encoding: "utf8",
    }
  );

  expect(await parse(xmlContent)).toMatchInlineSnapshot(`
    Array [
      Object {
        "attributes": Object {
          "hostname": "example.com",
          "ip_address": "10.50.0.2",
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 445,
          "protocol": "tcp",
          "scripts": null,
          "service": "microsoft-ds",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 445 is open using tcp protocol.",
        "location": "tcp://10.50.0.2:445",
        "name": "microsoft-ds",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      Object {
        "attributes": Object {
          "hostname": "example.com",
          "ip_address": "10.50.0.2",
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": "example.com",
        "name": "Host: example.com",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      Object {
        "attributes": Object {
          "hostname": "example.com",
          "ip_address": "10.50.0.2",
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 445,
          "protocol": "tcp",
          "scripts": "NT LM 0.12 (SMBv1) [dangerous, but default]",
          "service": "microsoft-ds",
          "serviceProduct": null,
          "serviceVersion": null,
          "smb_protocol_version": 1,
          "state": "open",
        },
        "category": "SMB",
        "description": "Port 445 is open using SMB protocol with an old version: SMBv1",
        "location": "tcp://10.50.0.2:445",
        "name": "SMB Dangerous Protocol Version Finding SMBv1",
        "osi_layer": "NETWORK",
        "severity": "HIGH",
      },
      Object {
        "attributes": Object {
          "hostname": "example.com",
          "ip_address": "10.50.0.2",
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 445,
          "protocol": "tcp",
          "scripts": "2.02",
          "service": "microsoft-ds",
          "serviceProduct": null,
          "serviceVersion": null,
          "smb_protocol_version": 2.02,
          "state": "open",
        },
        "category": "SMB",
        "description": "Port 445 is open using SMB protocol with an old version: 2.02",
        "location": "tcp://10.50.0.2:445",
        "name": "SMB Protocol Version Finding v2.02",
        "osi_layer": "NETWORK",
        "severity": "LOW",
      },
      Object {
        "attributes": Object {
          "hostname": "example.com",
          "ip_address": "10.50.0.2",
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 445,
          "protocol": "tcp",
          "scripts": "2.10",
          "service": "microsoft-ds",
          "serviceProduct": null,
          "serviceVersion": null,
          "smb_protocol_version": 2.1,
          "state": "open",
        },
        "category": "SMB",
        "description": "Port 445 is open using SMB protocol with an old version: 2.1",
        "location": "tcp://10.50.0.2:445",
        "name": "SMB Protocol Version Finding v2.1",
        "osi_layer": "NETWORK",
        "severity": "LOW",
      },
      Object {
        "attributes": Object {
          "hostname": "example.com",
          "ip_address": "10.50.0.2",
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 445,
          "protocol": "tcp",
          "scripts": "3.00",
          "service": "microsoft-ds",
          "serviceProduct": null,
          "serviceVersion": null,
          "smb_protocol_version": 3,
          "state": "open",
        },
        "category": "SMB",
        "description": "Port 445 is open using SMB protocol with version: 3",
        "location": "tcp://10.50.0.2:445",
        "name": "SMB Protocol Version Finding v3",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      Object {
        "attributes": Object {
          "hostname": "example.com",
          "ip_address": "10.50.0.2",
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 445,
          "protocol": "tcp",
          "scripts": "3.02",
          "service": "microsoft-ds",
          "serviceProduct": null,
          "serviceVersion": null,
          "smb_protocol_version": 3.02,
          "state": "open",
        },
        "category": "SMB",
        "description": "Port 445 is open using SMB protocol with version: 3.02",
        "location": "tcp://10.50.0.2:445",
        "name": "SMB Protocol Version Finding v3.02",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      Object {
        "attributes": Object {
          "hostname": "example.com",
          "ip_address": "10.50.0.2",
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 445,
          "protocol": "tcp",
          "scripts": "3.11",
          "service": "microsoft-ds",
          "serviceProduct": null,
          "serviceVersion": null,
          "smb_protocol_version": 3.11,
          "state": "open",
        },
        "category": "SMB",
        "description": "Port 445 is open using SMB protocol with version: 3.11",
        "location": "tcp://10.50.0.2:445",
        "name": "SMB Protocol Version Finding v3.11",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});
