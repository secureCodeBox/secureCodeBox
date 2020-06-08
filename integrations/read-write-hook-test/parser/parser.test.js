const fs = require("fs");
const util = require("util");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const { parse } = require("./parser");

test("should properly parse nmap xml file", async () => {
  const xmlContent = await readFile(
    __dirname + "/__testFiles__/localhost.xml",
    {
      encoding: "utf8"
    }
  );

  expect(await parse(xmlContent)).toMatchInlineSnapshot(`
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
    encoding: "utf8"
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
    encoding: "utf8"
  });

  expect(await parse(xmlContent)).toMatchInlineSnapshot(`Array []`);
});
