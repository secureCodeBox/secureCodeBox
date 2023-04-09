// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const util = require("util");
const {
  validateParser,
} = require("@securecodebox/parser-sdk-nodejs/parser-utils");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const {parse} = require("./parser");

test("should properly parse nmap xml file", async () => {
  const xmlContent = await readFile(
    __dirname + "/__testFiles__/localhost.xml",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(xmlContent);
  // validate findings
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "hostname": "localhost",
          "ip_addresses": [
            "127.0.0.1",
          ],
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
        "location": "tcp://localhost:53",
        "name": "Open Port: 53 (domain)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "localhost",
          "ip_addresses": [
            "127.0.0.1",
          ],
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
        "location": "tcp://localhost:8021",
        "name": "Open Port: 8021 (ftp-proxy)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "localhost",
          "ip_addresses": [
            "127.0.0.1",
          ],
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
        "location": "tcp://localhost:8080",
        "name": "Open Port: 8080 (http-proxy)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "localhost",
          "ip_addresses": [
            "127.0.0.1",
          ],
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
        "location": "tcp://localhost:9200",
        "name": "Open Port: 9200 (wap-wsp)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "localhost",
          "ip_addresses": [
            "127.0.0.1",
          ],
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

  const findings = await parse(xmlContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "hostname": "localhost",
          "ip_addresses": [
            "127.0.0.1",
          ],
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

  const findings = await parse(xmlContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`[]`);
});

test("should properly parse a nmap xml with missing service information", async () => {
  const xmlContent = await readFile(
    __dirname + "/__testFiles__/no-service.xml",
    {
      encoding: "utf8",
    }
  );

  const findings = await parse(xmlContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(findings).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "hostname": "example.com",
          "ip_addresses": [
            "93.184.216.34",
          ],
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
        "location": "tcp://example.com:10250",
        "name": "Open Port: 10250",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "example.com",
          "ip_addresses": [
            "93.184.216.34",
          ],
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

  const findings = await parse(xmlContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(await parse(xmlContent)).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "hostname": "example.com",
          "ip_addresses": [
            "10.50.0.2",
          ],
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
        "location": "tcp://example.com:445",
        "name": "Open Port: 445 (microsoft-ds)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "example.com",
          "ip_addresses": [
            "10.50.0.2",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": "example.com",
        "name": "Host: example.com",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "example.com",
          "ip_addresses": [
            "10.50.0.2",
          ],
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
        "location": "tcp://example.com:445",
        "name": "SMB Dangerous Protocol Version Finding SMBv1",
        "osi_layer": "NETWORK",
        "severity": "HIGH",
      },
      {
        "attributes": {
          "hostname": "example.com",
          "ip_addresses": [
            "10.50.0.2",
          ],
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
        "location": "tcp://example.com:445",
        "name": "SMB Protocol Version Finding v2.02",
        "osi_layer": "NETWORK",
        "severity": "LOW",
      },
      {
        "attributes": {
          "hostname": "example.com",
          "ip_addresses": [
            "10.50.0.2",
          ],
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
        "location": "tcp://example.com:445",
        "name": "SMB Protocol Version Finding v2.1",
        "osi_layer": "NETWORK",
        "severity": "LOW",
      },
      {
        "attributes": {
          "hostname": "example.com",
          "ip_addresses": [
            "10.50.0.2",
          ],
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
        "location": "tcp://example.com:445",
        "name": "SMB Protocol Version Finding v3",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "example.com",
          "ip_addresses": [
            "10.50.0.2",
          ],
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
        "location": "tcp://example.com:445",
        "name": "SMB Protocol Version Finding v3.02",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "example.com",
          "ip_addresses": [
            "10.50.0.2",
          ],
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
        "location": "tcp://example.com:445",
        "name": "SMB Protocol Version Finding v3.11",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});

test("should properly parse a script finding for ftp in an xml file", async () => {
  const xmlContent = await readFile(__dirname + "/__testFiles__/ftp.xml", {
    encoding: "utf8",
  });
  const findings = await parse(xmlContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(await parse(xmlContent)).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "hostname": "dummy-ftp.demo-targets.svc.cluster.local",
          "ip_addresses": [
            "10.103.42.74",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 21,
          "protocol": "tcp",
          "scripts": {
            "banner": "220---------- Welcome to Pure-FTPd [privsep] [TLS] ----------\\x
    0D\\x0A220-You are user number 2 of 30 allowed.\\x0D\\x0A220-Local time...
    ",
            "ftp-anon": "Anonymous FTP login allowed (FTP code 230)
    Can't get directory listing: PASV IP 127.0.0.1 is not the same as 10.103.42.74",
          },
          "service": "ftp",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 21 is open using tcp protocol.",
        "location": "tcp://dummy-ftp.demo-targets.svc.cluster.local:21",
        "name": "Open Port: 21 (ftp)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "dummy-ftp.demo-targets.svc.cluster.local",
          "ip_addresses": [
            "10.103.42.74",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": "dummy-ftp.demo-targets.svc.cluster.local",
        "name": "Host: dummy-ftp.demo-targets.svc.cluster.local",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "banner": "220---------- Welcome to Pure-FTPd [privsep] [TLS] ----------\\x
    0D\\x0A220-You are user number 2 of 30 allowed.\\x0D\\x0A220-Local time...
    ",
          "script": "banner",
        },
        "category": "FTP",
        "description": "Port 21 displays banner",
        "location": "ftp://dummy-ftp.demo-targets.svc.cluster.local:21",
        "name": "Server banner found",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "script": "ftp-anon",
        },
        "category": "FTP",
        "description": "Port 21 allows anonymous FTP login",
        "location": "ftp://dummy-ftp.demo-targets.svc.cluster.local:21",
        "name": "Anonymous FTP Login possible",
        "osi_layer": "NETWORK",
        "severity": "MEDIUM",
      },
    ]
  `);
});

test("should parse scanme.nmap.org results properly", async () => {
  const xmlContent = await readFile(
    __dirname + "/__testFiles__/scanme.nmap.org-ipv6.xml",
    {
      encoding: "utf8",
    }
  );
  const findings = await parse(xmlContent);
  await expect(validateParser(findings)).resolves.toBeUndefined();
  expect(await parse(xmlContent)).toMatchInlineSnapshot(`
    [
      {
        "attributes": {
          "hostname": "scanme.nmap.org",
          "ip_addresses": [
            "2600:3c01::f03c:91ff:fe18:bb2f",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 22,
          "protocol": "tcp",
          "scripts": null,
          "service": "ssh",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 22 is open using tcp protocol.",
        "location": "tcp://scanme.nmap.org:22",
        "name": "Open Port: 22 (ssh)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "scanme.nmap.org",
          "ip_addresses": [
            "2600:3c01::f03c:91ff:fe18:bb2f",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 80,
          "protocol": "tcp",
          "scripts": null,
          "service": "http",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 80 is open using tcp protocol.",
        "location": "tcp://scanme.nmap.org:80",
        "name": "Open Port: 80 (http)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "scanme.nmap.org",
          "ip_addresses": [
            "2600:3c01::f03c:91ff:fe18:bb2f",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 31337,
          "protocol": "tcp",
          "scripts": null,
          "service": "Elite",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 31337 is open using tcp protocol.",
        "location": "tcp://scanme.nmap.org:31337",
        "name": "Open Port: 31337 (Elite)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "scanme.nmap.org",
          "ip_addresses": [
            "2600:3c01::f03c:91ff:fe18:bb2f",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": "scanme.nmap.org",
        "name": "Host: scanme.nmap.org",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});
