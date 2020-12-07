const fs = require("fs");
const util = require("util");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const { parse } = require("./parser");

test("example parser parses empty json files to zero findings", async () => {
  const fileContent = await readFile(__dirname + "/__testFiles__/empty.jsonl", {
    encoding: "utf8",
  });
  expect(await parse(fileContent)).toEqual([]);
});

// test("example parser parses missing json files to zero findings", async () => {
//   expect(await parse(null)).toEqual([]);
// });

// test("example parser parses missing json files to zero findings", async () => {
//   expect(await parse(0)).toEqual([]);
// });

test("example parser parses single line json successully", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/example.com.jsonl",
    {
      encoding: "utf8",
    }
  );

  expect(await parse(fileContent)).toMatchInlineSnapshot(`
  Array [
    Object {
      "attributes": Object {
        "addresses": Array [
          Object {
            "asn": 34011,
            "cidr": "10.110.224.0/21",
            "desc": "GD-EMEA-DC-CGN1",
            "ip": "10.110.225.135",
          },
        ],
        "domain": "example.de",
        "name": "www.example.de",
        "source": undefined,
        "tag": "cert",
      },
      "category": "Subdomain",
      "description": "Found subdomain www.example.de",
      "location": "www.example.de",
      "name": "www.example.de",
      "osi_layer": "NETWORK",
      "severity": "INFORMATIONAL",
    },
  ]
  `);
});

test('example parser parses large json result successully', async () => {
  const fileContent = await readFile(
    __dirname + '/__testFiles__/securecodebox.io.jsonl',
    {
      encoding: 'utf8',
    }
  );

  expect(await parse(fileContent)).toMatchSnapshot();
});
