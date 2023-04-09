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

test("should parse output of runs run --verbose properly", async () => {
  const xmlContent = await readFile(
    __dirname + "/__testFiles__/local-network-verbose.xml",
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
          "hostname": "fritz.box",
          "ip_addresses": [
            "192.168.178.1",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 21,
          "protocol": "tcp",
          "scripts": null,
          "service": "ftp",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 21 is open using tcp protocol.",
        "location": "tcp://fritz.box:21",
        "name": "Open Port: 21 (ftp)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "fritz.box",
          "ip_addresses": [
            "192.168.178.1",
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
        "location": "tcp://fritz.box:53",
        "name": "Open Port: 53 (domain)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "fritz.box",
          "ip_addresses": [
            "192.168.178.1",
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
        "location": "tcp://fritz.box:80",
        "name": "Open Port: 80 (http)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "fritz.box",
          "ip_addresses": [
            "192.168.178.1",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 443,
          "protocol": "tcp",
          "scripts": null,
          "service": "https",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 443 is open using tcp protocol.",
        "location": "tcp://fritz.box:443",
        "name": "Open Port: 443 (https)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "fritz.box",
          "ip_addresses": [
            "192.168.178.1",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 554,
          "protocol": "tcp",
          "scripts": null,
          "service": "rtsp",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 554 is open using tcp protocol.",
        "location": "tcp://fritz.box:554",
        "name": "Open Port: 554 (rtsp)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "fritz.box",
          "ip_addresses": [
            "192.168.178.1",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 5060,
          "protocol": "tcp",
          "scripts": null,
          "service": "sip",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 5060 is open using tcp protocol.",
        "location": "tcp://fritz.box:5060",
        "name": "Open Port: 5060 (sip)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "fritz.box",
          "ip_addresses": [
            "192.168.178.1",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 8089,
          "protocol": "tcp",
          "scripts": null,
          "service": "unknown",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 8089 is open using tcp protocol.",
        "location": "tcp://fritz.box:8089",
        "name": "Open Port: 8089 (unknown)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "fritz.box",
          "ip_addresses": [
            "192.168.178.1",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 8181,
          "protocol": "tcp",
          "scripts": null,
          "service": "intermapper",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 8181 is open using tcp protocol.",
        "location": "tcp://fritz.box:8181",
        "name": "Open Port: 8181 (intermapper)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.32",
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
        "location": "tcp://unknown-address:80",
        "name": "Open Port: 80 (http)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.32",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 7000,
          "protocol": "tcp",
          "scripts": null,
          "service": "afs3-fileserver",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 7000 is open using tcp protocol.",
        "location": "tcp://unknown-address:7000",
        "name": "Open Port: 7000 (afs3-fileserver)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.32",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 8082,
          "protocol": "tcp",
          "scripts": null,
          "service": "blackice-alerts",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 8082 is open using tcp protocol.",
        "location": "tcp://unknown-address:8082",
        "name": "Open Port: 8082 (blackice-alerts)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.32",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 8083,
          "protocol": "tcp",
          "scripts": null,
          "service": "us-srv",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 8083 is open using tcp protocol.",
        "location": "tcp://unknown-address:8083",
        "name": "Open Port: 8083 (us-srv)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.32",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 8085,
          "protocol": "tcp",
          "scripts": null,
          "service": "unknown",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 8085 is open using tcp protocol.",
        "location": "tcp://unknown-address:8085",
        "name": "Open Port: 8085 (unknown)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.32",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 8200,
          "protocol": "tcp",
          "scripts": null,
          "service": "trivnet1",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 8200 is open using tcp protocol.",
        "location": "tcp://unknown-address:8200",
        "name": "Open Port: 8200 (trivnet1)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.42",
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
        "location": "tcp://unknown-address:80",
        "name": "Open Port: 80 (http)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.49",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 5000,
          "protocol": "tcp",
          "scripts": null,
          "service": "upnp",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 5000 is open using tcp protocol.",
        "location": "tcp://unknown-address:5000",
        "name": "Open Port: 5000 (upnp)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.49",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 7000,
          "protocol": "tcp",
          "scripts": null,
          "service": "afs3-fileserver",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 7000 is open using tcp protocol.",
        "location": "tcp://unknown-address:7000",
        "name": "Open Port: 7000 (afs3-fileserver)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.49",
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
        "location": "tcp://unknown-address:8080",
        "name": "Open Port: 8080 (http-proxy)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.49",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 8081,
          "protocol": "tcp",
          "scripts": null,
          "service": "blackice-icecap",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 8081 is open using tcp protocol.",
        "location": "tcp://unknown-address:8081",
        "name": "Open Port: 8081 (blackice-icecap)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.166",
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
        "location": "tcp://unknown-address:80",
        "name": "Open Port: 80 (http)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.166",
          ],
          "mac_address": null,
          "method": "table",
          "operating_system": null,
          "port": 443,
          "protocol": "tcp",
          "scripts": null,
          "service": "https",
          "serviceProduct": null,
          "serviceVersion": null,
          "state": "open",
          "tunnel": null,
        },
        "category": "Open Port",
        "description": "Port 443 is open using tcp protocol.",
        "location": "tcp://unknown-address:443",
        "name": "Open Port: 443 (https)",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.0",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.2",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.3",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.4",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.5",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.6",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.7",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.8",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.9",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.10",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.11",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.12",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.13",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.14",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.15",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.16",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.17",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.18",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.19",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.20",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.21",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.22",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.23",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.24",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.25",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.26",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.27",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.28",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.30",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.31",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.33",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.34",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.35",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.37",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.38",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.39",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.40",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.41",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.43",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.44",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.45",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.46",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.47",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.51",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.52",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.53",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.54",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.55",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.57",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.58",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.59",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.60",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.61",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.62",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.63",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.64",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.65",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.66",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.67",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.68",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.69",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.70",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.71",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.72",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.73",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.74",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.75",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.76",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.77",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.78",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.79",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.80",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.81",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.82",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.83",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.84",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.85",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.86",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.87",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.88",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.89",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.90",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.91",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.92",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.93",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.94",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.95",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.96",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.97",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.98",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.99",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.100",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.101",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.102",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.103",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.104",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.105",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.106",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.107",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.108",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.109",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.110",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.111",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.112",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.113",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.114",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.115",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.116",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.117",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.118",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.119",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.120",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.121",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.122",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.123",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.124",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.125",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.126",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.127",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.128",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.129",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.130",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.131",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.132",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.133",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.134",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.135",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.136",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.137",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.138",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.139",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.140",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.141",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.142",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.143",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.144",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.145",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.146",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.147",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.148",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.149",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.150",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.151",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.152",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.153",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.154",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.155",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.156",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.157",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.158",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.159",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.160",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.161",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.162",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.163",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.164",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.165",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.167",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.168",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.169",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.170",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.171",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.172",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.173",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.174",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.175",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.176",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.177",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.178",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.179",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.180",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.181",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.182",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.183",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.184",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.185",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.186",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.187",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.188",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.189",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.190",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.191",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.192",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.193",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.194",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.195",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.196",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.197",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.198",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.199",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.200",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.201",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.202",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.203",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.204",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.205",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.206",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.207",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.208",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.209",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.210",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.211",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.212",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.213",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.214",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.215",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.216",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.217",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.218",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.219",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.220",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.221",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.222",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.223",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.224",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.225",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.226",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.227",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.228",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.229",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.230",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.231",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.232",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.233",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.234",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.235",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.236",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.237",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.238",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.239",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.240",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.241",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.242",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.243",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.244",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.245",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.246",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.247",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.248",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.249",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.250",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.251",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.252",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.253",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.254",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.255",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": "fritz.box",
          "ip_addresses": [
            "192.168.178.1",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": "fritz.box",
        "name": "Host: fritz.box",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.32",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.42",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.49",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
      {
        "attributes": {
          "hostname": null,
          "ip_addresses": [
            "192.168.178.166",
          ],
          "operating_system": null,
        },
        "category": "Host",
        "description": "Found a host",
        "location": null,
        "name": "Host: unknown-address",
        "osi_layer": "NETWORK",
        "severity": "INFORMATIONAL",
      },
    ]
  `);
});
